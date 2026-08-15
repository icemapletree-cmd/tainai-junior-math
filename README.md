# 小包子学数学

为零基础长辈准备的中文初中数学学习网站。从小学基础补起，按照“启蒙补基础 → 七年级 → 八年级 → 九年级”的顺序学习。

公开网站：[https://icemapletree-cmd.github.io/tainai-junior-math/](https://icemapletree-cmd.github.io/tainai-junior-math/)

## 课程内容

- 36 个单元、113 小课
- 113 道分步例题、228 道带提示和答案的练习
- 覆盖四则运算、分数与小数、方程、函数、几何、统计、概率等初中核心内容
- 每课使用短句和生活化例子，不默认学习者已经掌握数学术语

## 网站功能

- 分阶段课程目录与知识搜索
- 例题分步讲解
- 练习提示和折叠答案
- 本机学习进度记录
- 字体大小调节
- 当前课程打印
- 适配电脑、平板和手机

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

完成检查：

```bash
npm run build
node --test tests/rendered-html.test.mjs
```

网站使用 React、TypeScript 和 vinext 构建。
