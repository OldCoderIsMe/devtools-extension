#import <Cocoa/Cocoa.h>
#import <QuickLookUI/QuickLookUI.h>
#import <WebKit/WebKit.h>

@interface MarkdownQuickLookViewController : NSViewController <QLPreviewingController>
@end

static NSString *EscapeHTML(NSString *value) {
  NSMutableString *escaped = [value mutableCopy];
  [escaped replaceOccurrencesOfString:@"&" withString:@"&amp;" options:0 range:NSMakeRange(0, escaped.length)];
  [escaped replaceOccurrencesOfString:@"<" withString:@"&lt;" options:0 range:NSMakeRange(0, escaped.length)];
  [escaped replaceOccurrencesOfString:@">" withString:@"&gt;" options:0 range:NSMakeRange(0, escaped.length)];
  [escaped replaceOccurrencesOfString:@"\\\"" withString:@"&quot;" options:0 range:NSMakeRange(0, escaped.length)];
  return escaped;
}

static NSString *RenderInline(NSString *line) {
  NSString *escaped = EscapeHTML(line);
  NSRegularExpression *code = [NSRegularExpression regularExpressionWithPattern:@"`([^`]+)`" options:0 error:nil];
  escaped = [code stringByReplacingMatchesInString:escaped options:0 range:NSMakeRange(0, escaped.length) withTemplate:@"<code>$1</code>"];
  NSRegularExpression *strong = [NSRegularExpression regularExpressionWithPattern:@"\\\\*\\\\*([^*]+)\\\\*\\\\*" options:0 error:nil];
  escaped = [strong stringByReplacingMatchesInString:escaped options:0 range:NSMakeRange(0, escaped.length) withTemplate:@"<strong>$1</strong>"];
  NSRegularExpression *emphasis = [NSRegularExpression regularExpressionWithPattern:@"(?<!\\\\*)\\\\*([^*]+)\\\\*(?!\\\\*)" options:0 error:nil];
  return [emphasis stringByReplacingMatchesInString:escaped options:0 range:NSMakeRange(0, escaped.length) withTemplate:@"<em>$1</em>"];
}

static NSString *RenderMarkdown(NSString *source) {
  NSArray<NSString *> *lines = [source componentsSeparatedByCharactersInSet:[NSCharacterSet newlineCharacterSet]];
  NSMutableString *body = [NSMutableString string];
  BOOL inCode = NO;
  BOOL inList = NO;

  for (NSString *rawLine in lines) {
    NSString *line = [rawLine stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    if ([line hasPrefix:@"```"]) {
      if (!inCode) {
        if (inList) { [body appendString:@"</ul>"]; inList = NO; }
        inCode = YES;
        NSString *language = [line substringFromIndex:3];
        NSString *label = language.length ? [NSString stringWithFormat:@"<span class=\\\"code-language\\\">%@</span>", EscapeHTML(language)] : @"";
        [body appendFormat:@"<div class=\\\"code-wrap\\\">%@<pre><code>", label];
      } else {
        inCode = NO;
        [body appendString:@"</code></pre></div>"];
      }
      continue;
    }

    if (inCode) {
      [body appendFormat:@"%@\\n", EscapeHTML(rawLine)];
      continue;
    }

    if (line.length == 0) {
      if (inList) { [body appendString:@"</ul>"]; inList = NO; }
      continue;
    }

    NSUInteger headingLength = 0;
    while (headingLength < line.length && [line characterAtIndex:headingLength] == '#') headingLength++;
    if (headingLength > 0 && headingLength <= 6 && headingLength < line.length && [line characterAtIndex:headingLength] == ' ') {
      if (inList) { [body appendString:@"</ul>"]; inList = NO; }
      NSString *heading = [line substringFromIndex:headingLength + 1];
      [body appendFormat:@"<h%lu>%@</h%lu>", (unsigned long)headingLength, RenderInline(heading), (unsigned long)headingLength];
      continue;
    }

    if ([line hasPrefix:@"- "] || [line hasPrefix:@"* "] || [line hasPrefix:@"+ "]) {
      if (!inList) { [body appendString:@"<ul>"]; inList = YES; }
      [body appendFormat:@"<li>%@</li>", RenderInline([line substringFromIndex:2])];
      continue;
    }

    if (inList) { [body appendString:@"</ul>"]; inList = NO; }
    if ([line hasPrefix:@"> "]) {
      [body appendFormat:@"<blockquote>%@</blockquote>", RenderInline([line substringFromIndex:2])];
    } else {
      [body appendFormat:@"<p>%@</p>", RenderInline(line)];
    }
  }

  if (inCode) [body appendString:@"</code></pre></div>"];
  if (inList) [body appendString:@"</ul>"];
  return body;
}

@implementation MarkdownQuickLookViewController {
  WKWebView *_webView;
}

- (void)loadView {
  _webView = [[WKWebView alloc] initWithFrame:NSMakeRect(0, 0, 720, 520)];
  self.view = _webView;
  self.preferredContentSize = NSMakeSize(720, 520);
  self.title = @"DevTools Suite Markdown";
}

- (void)preparePreviewOfFileAtURL:(NSURL *)url completionHandler:(void (^)(NSError * _Nullable error))handler {
  NSError *readError = nil;
  NSString *source = [NSString stringWithContentsOfURL:url encoding:NSUTF8StringEncoding error:&readError];
  if (!source) {
    handler(readError ?: [NSError errorWithDomain:@"DevToolsSuiteQuickLook" code:1 userInfo:@{NSLocalizedDescriptionKey: @"无法读取 Markdown 文件"}]);
    return;
  }

  NSString *html = [NSString stringWithFormat:@"<!doctype html><html><head><meta charset=\\\"utf-8\\\"><style>html{background:#fff}body{font-family:-apple-system,BlinkMacSystemFont,\\\"Helvetica Neue\\\",sans-serif;color:#202124;line-height:1.6;padding:28px 36px;margin:0;word-wrap:break-word}h1,h2,h3,h4,h5,h6{line-height:1.25;margin:1.1em 0 .5em;color:#111}h1{font-size:2em;border-bottom:1px solid #e5e7eb;padding-bottom:.25em}h2{font-size:1.5em;border-bottom:1px solid #e5e7eb;padding-bottom:.2em}p{margin:.7em 0}blockquote{border-left:4px solid #d1d5db;margin:1em 0;padding:.2em 1em;color:#6b7280;background:#f9fafb}ul{padding-left:1.5em}code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#f3f4f6;border-radius:4px;padding:.12em .35em;font-size:.9em}.code-wrap{position:relative;margin:1em 0}.code-language{display:block;color:#6b7280;font-size:11px;margin-bottom:2px}pre{background:#f6f8fa;border:1px solid #e5e7eb;border-radius:7px;padding:12px;overflow:auto}pre code{background:transparent;padding:0;white-space:pre}a{color:#1769da}</style></head><body><div class=\\\"brand\\\"><strong>DevTools Suite Markdown</strong></div>%@</body></html>", RenderMarkdown(source)];
  [_webView loadHTMLString:html baseURL:url.URLByDeletingLastPathComponent];
  handler(nil);
}

@end
