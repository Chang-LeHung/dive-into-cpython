import { readdirSync, statSync } from "fs";
import { join, basename } from "path";
import process from "process";

// 添加一个函数来获取文件的第一个标题
function getFirstTitle(filePath) {
  try {
    const content = require('fs').readFileSync(filePath, 'utf-8');
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : basename(filePath, '.md');
  } catch (error) {
    return basename(filePath, '.md');
  }
}

// 添加一个函数来生成侧边栏配置
function generateSidebar(dir) {
  const items = [];
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // 处理子目录
      const children = generateSidebar(filePath);
      if (children.length > 0) {
        items.push({
          text: basename(file),
          items: children
        });
      }
    } else if (file.endsWith('.md') && file !== 'index.md') {
      // 处理 markdown 文件
      const title = getFirstTitle(filePath);
      items.push({
        text: title,
        link: `/${file}`
      });
    }
  }

  return items;
}

export default {
  title: "Dive into CPython",
  description: "Just playing around.",

  // 添加基础路径配置
  base: '/dive-into-cpython/',

  themeConfig: {
    // 使用硬编码的方式配置 sidebar
    sidebar: [
      {
        text: 'Builtin 对象实现',
        items: [
          { text: 'List 对象', link: '/objects/01list' },
          { text: 'Tuple 对象', link: '/objects/02tuple' },
          { text: 'Float 对象', link: '/objects/03float' },
          { text: 'Long 对象', link: '/objects/04long' },
          { text: 'Complex 对象', link: '/objects/05complex' },
          { text: 'Set 对象', link: '/objects/06set' },
          { text: 'Dict 对象', link: '/objects/07dict' },
          { text: 'Bytes 对象', link: '/objects/08bytes' },
          { text: 'Dict 实现', link: '/objects/09dict' }
        ]
      },
      {
        text: '对象系统',
        items: [
          { text: '类机制', link: '/obsy/01class' },
          { text: '应用实例', link: '/obsy/02application' },
          { text: '描述器', link: '/obsy/03decriptor' },
          { text: 'MRO', link: '/obsy/04mro' },
          { text: '魔术方法(上)', link: '/obsy/05magicmethod' },
          { text: '魔术方法(下)', link: '/obsy/06magicmethod02' },
          { text: 'Super 机制', link: '/obsy/07super' }
        ]
      },
      {
        text: '虚拟机',
        items: [
          { text: 'PYC 文件', link: '/pvm/01pyc' },
          { text: '反序列化 PYC', link: '/pvm/09binpyc' },
          { text: 'Code Object', link: '/pvm/02codeobject' },
          { text: '字节码', link: '/pvm/03bytecode' },
          { text: '字节码教程(上)', link: '/pvm/04bytecode_tutorial' },
          { text: '字节码教程(中)', link: '/pvm/05bytecode_tutorial' },
          { text: '字节码教程(下)', link: '/pvm/06bytecode_tutorial' },
          { text: 'Frame Object', link: '/pvm/07frameobject' },
          { text: '调试器', link: '/pvm/08debugger' },
        ]
      }
    ],

    // 确保使用正确的图标类型
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/Chang-LeHung",
      },
      {
        icon: "zhihu",
        link: "https://www.zhihu.com/people/lbj-31-91",
      },
      { icon: "twitter", link: "https://x.com/hchng28935" }, // 将 'x' 改为 'twitter'
      {
        icon: "bilibili",
        link: "https://space.bilibili.com/576236330?spm_id_from=333.1007.0.0",
      },
    ],

    nav: [
      { text: "Home", link: "https://chang-lehung.github.io/#/" },
      { text: "About", link: "https://chang-lehung.github.io/#/" },
      {
        link: "https://github.com/Chang-LeHung",
        icon: "github",
      },
      {
        text: "其他博客",
        items: [
          {
            text: "dive-into-hotspot",
            link: "https://chang-lehung.github.io/dive-into-hotspot/",
          },
          {
            text: "计算机系统基础",
            link: "https://chang-lehung.github.io/cscore/",
          },
        ],
      },
    ],
  },

  // 修改 markdown 配置，使用默认主题
  markdown: {
    lineNumbers: true,
  },
};
