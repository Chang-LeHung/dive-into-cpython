import { defaultTheme, defineUserConfig } from "vuepress";
import fs from "fs";
import path from "path";

function generateSidebar(dir, parentPath = "") {
  const sidebar = [];

  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const itemPath = path.join(dir, item);
    const relativePath = path.join(parentPath, item);

    if (fs.statSync(itemPath).isDirectory()) {
      const children = generateSidebar(itemPath, relativePath);
      if (children.length > 0) {
        sidebar.push({
          text: item,
          children,
        });
      }
    } else {
      if (item.endsWith(".md") && item !== "README.md" && item.indexOf("upload") == -1) {
        sidebar.push(relativePath.replace(".md", ""));
      }
    }
  });

  return sidebar;
}

export default defineUserConfig({
  lang: "zh-CN",
  title: "Dive into CPython virtual machine",
  description: "深入理解 CPython 虚拟机",
  base: "/dive-into-cpython/",
  theme: defaultTheme({
    "logo": "profile.jpeg",
    navbar: [
      { text: "首页", link: "/" },
      { text: "数据结构对象", link: "/objects/" },
      { text: "对象系统", link: "/obsy/" },
      { text: "PVM", link: "/pvm/" },
      { text: "Github", link: "https://github.com/Chang-LeHung/dive-into-cpython"}
    ],
    // 自动配置侧边栏
    sidebar: {
      "/objects/": generateSidebar(path.resolve(__dirname, "../../objects")),
      "/pvm/": generateSidebar(path.resolve(__dirname, "../../pvm")),
      '/obsy': generateSidebar(path.resolve(__dirname, "../../obsy")),
    },
  }),
});
