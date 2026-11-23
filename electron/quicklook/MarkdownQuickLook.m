#import <Foundation/Foundation.h>
#import <QuickLook/QuickLook.h>

static NSString *EscapeHTML(NSString *value) {
  NSMutableString *escaped = [value mutableCopy];
  [escaped replaceOccurrencesOfString:@"&" withString:@"&amp;" options:0 range:NSMakeRange(0, escaped.length)];
  [escaped replaceOccurrencesOfString:@"<" withString:@"&lt;" options:0 range:NSMakeRange(0, escaped.length)];
  [escaped replaceOccurrencesOfString:@">" withString:@"&gt;" options:0 range:NSMakeRange(0, escaped.length)];
  [escaped replaceOccurrencesOfString:@"\"" withString:@"&quot;" options:0 range:NSMakeRange(0, escaped.length)];
  return escaped;
}

static NSString *InlineMarkdown(NSString *line) {
  NSString *escaped = EscapeHTML(line);
  NSRegularExpression *code = [NSRegularExpression regularExpressionWithPattern:@"`([^`]+)`" options:0 error:nil];
  escaped = [code stringByReplacingMatchesInString:escaped options:0 range:NSMakeRange(0, escaped.length) withTemplate:@"<code>$1</code>"];
  NSRegularExpression *strong = [NSRegularExpression regularExpressionWithPattern:@"\\*\\*([^*]+)\\*\\*" options:0 error:nil];
  escaped = [strong stringByReplacingMatchesInString:escaped options:0 range:NSMakeRange(0, escaped.length) withTemplate:@"<strong>$1</strong>"];
  NSRegularExpression *emphasis = [NSRegularExpression regularExpressionWithPattern:@"(?<!\\*)\\*([^*]+)\\*(?!\\*)" options:0 error:nil];
  return [emphasis stringByReplacingMatchesInString:escaped options:0 range:NSMakeRange(0, escaped.length) withTemplate:@"<em>$1</em>"];
}

static NSString *RenderMarkdown(NSString *source) {
  NSArray<NSString *> *lines = [source componentsSeparatedByCharactersInSet:[NSCharacterSet newlineCharacterSet]];
  NSMutableString *body = [NSMutableString string];
  BOOL inCode = NO;
  BOOL inList = NO;
  BOOL inOrderedList = NO;

  for (NSString *rawLine in lines) {
    NSString *line = [rawLine stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    if ([line hasPrefix:@"```"]) {
      if (!inCode) {
        inCode = YES;
        NSString *language = [line substringFromIndex:3];
        NSString *label = language.length > 0 ? [NSString stringWithFormat:@"<span class=\"code-language\">%@</span>", EscapeHTML(language)] : @"";
        [body appendFormat:@"<div class=\"code-wrap\">%@<pre><code>", label];
      } else {
        inCode = NO;
        [body appendString:@"</code></pre></div>"];
      }
      continue;
    }

    if (inCode) {
      [body appendFormat:@"%@\n", EscapeHTML(rawLine)];
      continue;
    }

    if (line.length == 0) {
      if (inList) {
        [body appendString:inOrderedList ? @"</ol>" : @"</ul>"];
        inList = NO;
        inOrderedList = NO;
      }
      continue;
    }

    NSRegularExpression *heading = [NSRegularExpression regularExpressionWithPattern:@"^(#{1,6})\\s+(.+)$" options:0 error:nil];
    NSTextCheckingResult *headingMatch = [heading firstMatchInString:line options:0 range:NSMakeRange(0, line.length)];
    if (headingMatch) {
      if (inList) {
        [body appendString:inOrderedList ? @"</ol>" : @"</ul>"];
        inList = NO;
        inOrderedList = NO;
      }
      NSUInteger level = [headingMatch rangeAtIndex:1].length;
      NSString *content = [line substringWithRange:[headingMatch rangeAtIndex:2]];
      [body appendFormat:@"<h%lu>%@</h%lu>", (unsigned long)level, InlineMarkdown(content), (unsigned long)level];
      continue;
    }

    if ([line hasPrefix:@"> "] || [line isEqualToString:@">"]) {
      if (inList) {
        [body appendString:inOrderedList ? @"</ol>" : @"</ul>"];
        inList = NO;
        inOrderedList = NO;
      }
      NSString *quote = line.length > 2 ? [line substringFromIndex:2] : @"";
      [body appendFormat:@"<blockquote>%@</blockquote>", InlineMarkdown(quote)];
      continue;
    }

    if ([line isEqualToString:@"---"] || [line isEqualToString:@"***"]) {
      [body appendString:@"<hr>"];
      continue;
    }

    NSRegularExpression *unordered = [NSRegularExpression regularExpressionWithPattern:@"^[-*+]\\s+(.+)$" options:0 error:nil];
    NSTextCheckingResult *unorderedMatch = [unordered firstMatchInString:line options:0 range:NSMakeRange(0, line.length)];
    NSRegularExpression *ordered = [NSRegularExpression regularExpressionWithPattern:@"^\\d+\\.\\s+(.+)$" options:0 error:nil];
    NSTextCheckingResult *orderedMatch = [ordered firstMatchInString:line options:0 range:NSMakeRange(0, line.length)];
    if (unorderedMatch || orderedMatch) {
      BOOL orderedList = orderedMatch != nil;
      if (!inList || inOrderedList != orderedList) {
        if (inList) [body appendString:inOrderedList ? @"</ol>" : @"</ul>"];
        [body appendString:orderedList ? @"<ol>" : @"<ul>"];
        inList = YES;
        inOrderedList = orderedList;
      }
      NSRange contentRange = orderedList ? [orderedMatch rangeAtIndex:1] : [unorderedMatch rangeAtIndex:1];
      [body appendFormat:@"<li>%@</li>", InlineMarkdown([line substringWithRange:contentRange])];
      continue;
    }

    if (inList) {
      [body appendString:inOrderedList ? @"</ol>" : @"</ul>"];
      inList = NO;
      inOrderedList = NO;
    }
    [body appendFormat:@"<p>%@</p>", InlineMarkdown(line)];
  }

  if (inCode) [body appendString:@"</code></pre></div>"];
  if (inList) [body appendString:inOrderedList ? @"</ol>" : @"</ul>"];
  return body;
}

OSStatus GeneratePreviewForURL(void *thisInterface, QLPreviewRequestRef preview, CFURLRef url, CFStringRef contentTypeUTI, CFDictionaryRef options) {
  @autoreleasepool {
    NSURL *fileURL = (__bridge NSURL *)url;
    NSError *error = nil;
    NSString *source = [NSString stringWithContentsOfURL:fileURL encoding:NSUTF8StringEncoding error:&error];
    if (!source) return -1;

    NSString *title = fileURL.lastPathComponent ?: @"Markdown";
    NSString *body = RenderMarkdown(source);
    NSString *html = [NSString stringWithFormat:
      @"<!doctype html><html><head><meta charset='utf-8'><style>"
      @"*{box-sizing:border-box}body{margin:0;padding:28px 34px;color:#202124;background:#fff;font:15px/-1.7 -apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif}"
      @"main{max-width:900px;margin:0 auto}h1,h2,h3,h4,h5,h6{line-height:1.25;margin:1.2em 0 .55em;border-bottom:1px solid #e5e7eb;padding-bottom:.25em}"
      @"p,li{color:#374151}blockquote{margin:1em 0;padding:.55em 1em;border-left:4px solid #9ca3af;background:#f3f4f6;color:#4b5563}"
      @"code{padding:.15em .35em;border-radius:4px;background:#f3f4f6;font:13px ui-monospace,SFMono-Regular,Menlo,monospace}.code-wrap{margin:1em 0;position:relative}pre{padding:14px;overflow:auto;border-radius:8px;background:#111827;color:#f9fafb}pre code{padding:0;background:transparent;color:inherit}.code-language{display:block;margin-bottom:-10px;padding:7px 12px;border-radius:8px 8px 0 0;background:#1f2937;color:#9ca3af;font:11px ui-monospace,monospace}hr{border:0;border-top:1px solid #e5e7eb;margin:2em 0}"
      @"</style></head><body><main><h1>%@</h1>%@</main></body></html>",
      EscapeHTML(title), body];
    NSData *data = [html dataUsingEncoding:NSUTF8StringEncoding];
    QLPreviewRequestSetDataRepresentation(preview, (__bridge CFDataRef)data, CFSTR("public.html"), NULL);
    return noErr;
  }
}

void CancelPreviewGeneration(void *thisInterface, QLPreviewRequestRef preview) {
  // Rendering is synchronous; there is nothing to cancel.
}
