from PIL import Image, ImageDraw, ImageFont
import shutil
import json
import os
import warnings

warnings.filterwarnings("ignore", category=DeprecationWarning)


def add_water_mark():
    # 打开原始图片
    with open("watermark.json", "r+") as fp:
        marked = set(json.load(fp))
    for image_path in os.listdir("images"):
        filename = os.path.join("images", image_path)
        if image_path not in marked:
            print(f"move {image_path} to nowatermark directory")
            shutil.copy(filename, os.path.join("nowatermark", image_path))
            marked.add(image_path)
            original_image = Image.open(filename)
            original_width, original_height = original_image.size

            # 设置水印文本和字体
            watermark_text = '@一无是处的研究僧(全网同名)'  # 水印文本
            font_size = int(original_width / 25)  # 字体大小随图片宽度变化
            font = ImageFont.truetype('font.ttf', font_size)  # 替换为你喜欢的字体

            # 创建透明的水印图像
            watermark_image = Image.new('RGBA', (original_width, original_height), (0, 0, 0, 0))
            draw = ImageDraw.Draw(watermark_image)

            # 计算水印文本的大小和位置
            text_width, text_height = draw.textsize(watermark_text, font)
            angle = 0  # 文本旋转角度，可以调整为你想要的倾斜角度
            x = original_width - text_width - 10  # 水印文本距离右下角的横向偏移量
            y = original_height - text_height - 10  # 水印文本距离右下角的纵向偏移量

            # 在水印图像上绘制旋转后的文本
            rotated_text = watermark_text  # 保留原始文本，用于计算旋转后的大小
            rotated_font = ImageFont.truetype('font.ttf', font_size)  # 使用同样大小的字体，以保持字号不变
            rotated_text_width, rotated_text_height = draw.textsize(rotated_text, rotated_font)
            rotated_text_image = Image.new('RGBA', (rotated_text_width, rotated_text_height), (0, 0, 0, 0))
            rotated_text_draw = ImageDraw.Draw(rotated_text_image)
            rotated_text_draw.text((0, 0), rotated_text, fill=(0, 0, 255, 180), font=rotated_font)
            rotated_text_image = rotated_text_image.rotate(angle, expand=True)  # 旋转文本图像
            watermark_image.paste(rotated_text_image, (x, y), rotated_text_image)  # 将旋转后的文本粘贴到水印图像上

            # 将水印图像叠加到原始图片上
            watermarked_image = Image.alpha_composite(original_image.convert('RGBA'), watermark_image)

            # 保存带有水印的图片
            watermarked_image.save(filename)  # 替换为你希望保存的文件路径

    with open("watermark.json", "w+") as fp:
        json.dump(list(marked), fp, indent=4, ensure_ascii=False)


if __name__ == '__main__':
    add_water_mark()
