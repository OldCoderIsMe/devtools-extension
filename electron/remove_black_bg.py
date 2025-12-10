#!/usr/bin/env python3
"""
移除图标中的黑色背景，转换为透明背景
"""
from PIL import Image
import os
import sys

def remove_black_background(input_path, output_path, threshold=30):
    """
    移除接近黑色的背景，转换为透明
    
    Args:
        input_path: 输入图片路径
        output_path: 输出图片路径
        threshold: 黑色阈值（RGB 值小于此值视为黑色）
    """
    try:
        img = Image.open(input_path).convert('RGBA')
        data = img.getdata()
        
        new_data = []
        for item in data:
            r, g, b, a = item
            # 如果像素接近黑色（RGB 都小于阈值），设为透明
            if r < threshold and g < threshold and b < threshold:
                new_data.append((0, 0, 0, 0))  # 完全透明
            else:
                new_data.append(item)
        
        img.putdata(new_data)
        img.save(output_path, 'PNG')
        print(f'✓ 处理完成: {os.path.basename(output_path)}')
        return True
    except Exception as e:
        print(f'✗ 处理失败 {input_path}: {e}')
        return False

def main():
    iconset_dir = os.path.dirname(os.path.abspath(__file__))
    devtools_iconset = os.path.join(iconset_dir, 'DevTools.iconset')
    
    if not os.path.exists(devtools_iconset):
        print(f'✗ 目录不存在: {devtools_iconset}')
        sys.exit(1)
    
    # 处理所有 PNG 文件
    processed = 0
    for filename in os.listdir(devtools_iconset):
        if filename.endswith('.png'):
            input_path = os.path.join(devtools_iconset, filename)
            remove_black_background(input_path, input_path)
            processed += 1
    
    print(f'\n✓ 共处理 {processed} 个图标文件')
    print('现在可以重新生成 icon.icns 文件')

if __name__ == '__main__':
    main()
