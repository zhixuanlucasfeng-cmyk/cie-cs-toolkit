# CIE CS 复习工具箱

给 Cambridge Computer Science（9618 / 9608 / 0478）考生用的两个复习工具，单文件、纯前端、零依赖、可离线使用。

**在线使用：** https://cie-cs-toolkit.vercel.app　·　[跑自检](https://cie-cs-toolkit.vercel.app/?selftest=1)

## 两个模块

### 1. 伪代码追踪表模拟器

把 CIE 伪代码逐行执行，自动生成追踪表（Trace Table）——每执行一行就记录所有变量的当前值和输出。

- 内置 9 段考题常见题型（冒泡排序、线性查找、哨兵值求和、二进制转换、字符串反转等），下拉即可加载单步跟踪
- 单步执行 / 自动播放 / 重置，当前执行行在编辑器里高亮
- 变量值发生变化时在表里标色，一眼看出哪一行改了什么
- 表格可一键复制成 TSV，直接粘进 Word 或 Excel
- 按 CIE 标准报错，不是丢一句 "SyntaxError"：
  - 变量没 `DECLARE` 就使用
  - 用 `=` 当赋值符号（应该用 `←`）
  - 数组访问下标 0（CIE 数组从 1 开始）
  - `ENDIF` / `ENDFOR` / `ENDWHILE` 缺失，并指出是第几行的语句没闭合
  - 死循环保护（超过 3000 步中止）

**支持的语法**

| 类别 | 内容 |
|---|---|
| 声明 | `DECLARE x : INTEGER/REAL/BOOLEAN/CHAR/STRING`、`DECLARE a : ARRAY[1:10] OF INTEGER`、`CONSTANT` |
| 运算 | `+ - * / MOD DIV &`，比较 `= <> < > <= >=`，逻辑 `AND OR NOT` |
| 选择 | `IF … THEN … ELSE … ENDIF`（`THEN` 可省略）、`CASE OF … OTHERWISE … ENDCASE` |
| 循环 | `FOR … TO … STEP … NEXT/ENDFOR`、`WHILE … DO … ENDWHILE`、`REPEAT … UNTIL` |
| 输入输出 | `OUTPUT`（支持逗号拼接）、`INPUT`（从输入队列按顺序取值） |
| 函数 | `LENGTH MID LEFT RIGHT UCASE LCASE INT ROUND` |

不支持自定义 `PROCEDURE` / `FUNCTION`、递归、二维数组、文件读写——追踪表考题里基本不出现这些，刻意砍掉以保证已支持部分的正确性。

### 2. 逻辑门与真值表生成器

输入布尔表达式，生成带**中间运算步骤**的完整真值表，以及对应的逻辑门电路图。

- 运算符：`AND OR NOT XOR NAND NOR` + 括号
- 优先级：`( )` > `NOT` > `AND`/`NAND` > `XOR` > `OR`/`NOR`
- 真值表不只给最终结果，每一步中间运算单独成列。例如 `(A XOR B) AND NOT C` 会展开成
  `A | B | C | A XOR B | NOT C | (A XOR B) AND NOT C`
- 电路图用手写 SVG 画标准门符号（AND 的 D 形、OR 的弧形、NOT 的三角加圈、XOR 的双弧），跟课本和考卷长得一样，不是标着文字的方框
- 相同的子表达式共用同一个门，跟真实电路一致

## 内置自检

逻辑正确性由 21 项断言覆盖（解释器语义、CIE 专属报错、真值表、运算符优先级、NAND/NOR）。

在网址后面加 `?selftest=1` 即可运行：

```
index.html?selftest=1
```

也可以在命令行跑：

```bash
node -e 'const fs=require("fs"),os=require("os"),p=require("path");
const s=fs.readFileSync("index.html","utf8").match(/<script>([\s\S]*?)<\/script>/)[1];
const f=p.join(os.tmpdir(),"core.js");fs.writeFileSync(f,s);
const r=require(f).runSelfTest();
r.forEach(x=>console.log((x.ok?"PASS ":"FAIL ")+x.name));
console.log(r.filter(x=>x.ok).length+"/"+r.length);'
```

## 本地运行

直接用浏览器打开 `index.html`。没有构建步骤，没有依赖，不需要联网。

## 部署到 Vercel

1. 把仓库推到 GitHub
2. vercel.com → Add New → Project → Import 这个仓库
3. Framework Preset 选 **Other**，Build Command 和 Output Directory 都**留空**
4. Deploy

之后 push 到 `main` 会自动重新部署。

## 说明

本工具仅供课后复习使用，禁止用于正式考试。
