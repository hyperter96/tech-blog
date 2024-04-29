---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/go-cover1-slices.jpeg
date: 2022-07-13
tag:
  - Go
  - 编程基础
sticky: 1
prev:
  text: 'Go 基础知识系列六：互斥锁mutex'
  link: '/posts/programming/go/mutex'
---

# Go 基础知识系列七：延迟函数调用Defer

`defer`语句用于延迟函数的调用，每次`defer`都会把一个函数压入栈中，函数返回前再把延迟的函数取出并执行。

为了方便描述，我们把创建`defer`的函数称为主函数，`defer`语句后面的函数称为延迟函数。

延迟函数可能有输入参数，这些参数可能来源于定义`defer`的函数，延迟函数也可能引用主函数用于返回的变量，也就是说延迟函数可能会影响主函数的一些行为，这些场景下，如果不了解`defer`的规则很容易出错。

## 规则一：延迟函数的参数在defer语句出现时就已经确定

官方给出一个例子，如下所示：

```go
func a() {
    i := 0
    defer fmt.Println(i)
    i++
    return
}
```

`defer`语句中的`fmt.Println()`参数i值在`defer`出现时就已经确定下来，实际上是拷贝了一份。后面对变量`i`的修改不会影响`fmt.Println()`函数的执行，仍然打印`0`。

:::warning 注意📢：
对于指针类型参数，规则仍然适用，只不过延迟函数的参数是一个地址值，这种情况下，`defer`后面的语句对变量的修改可能会影响延迟函数。
:::

> [!IMPORTANT] 例子一
> ```go
> func deferFuncParameter() {
>   var aInt = 1
>
>   defer fmt.Println(aInt)
>
>   aInt = 2
>   return
> }
> ```
> 题目说明：函数`deferFuncParameter()`定义一个整型变量并初始化为`1`，然后使用`defer`语句打印出变量值，最后修改变量值为`2`.
>
> 参考答案：输出`1`。延迟函数`fmt.Println(aInt)`的参数在`defer`语句出现时就已经确定了，所以无论后面如何修改`aInt`变量都不会影响延迟函数。

我们再来看另一个例子：

> [!IMPORTANT] 例子二
> ```go
> package main
>
> import "fmt"
>
> func printArray(array *[3]int) {
>   for i := range array {
>     fmt.Println(array[i])
>   }
> }
>
> func deferFuncParameter() {
>   var aArray = [3]int{1, 2, 3}
>
>   defer printArray(&aArray)
>
>   aArray[0] = 10
>   return
> }
>
> func main() {
>   deferFuncParameter()
> }
> ```
> 函数说明：函数`deferFuncParameter()`定义一个数组，通过`defer`延迟函数`printArray()`的调用，最后修改数组第一个元素。`printArray()`函数接受数组的指针并把数组全部打印出来。
>
> 参考答案：输出`10、2、3`三个值。延迟函数`printArray()`的参数在`defer`语句出现时就已经确定了，即数组的地址，由于延迟函数执行时机是在return语句之前，所以对数组的最终修改值会被打印出来。


## 规则二：延迟函数执行按后进先出顺序执行，即先出现的`defer`最后执行

这个规则很好理解，定义`defer`类似于入栈操作，执行`defer`类似于出栈操作。

设计`defer`的初衷是简化函数返回时资源清理的动作，资源往往有依赖顺序，比如先申请`A`资源，再跟据`A`资源申请`B`资源，跟据`B`资源申请`C`资源，即申请顺序是:`A—>B—>C`，释放时往往又要反向进行。这就是`defer`设计成FIFO的原因。

每申请到一个用完需要释放的资源时，立即定义一个`defer`来释放资源是个很好的习惯。

## 规则三：延迟函数可能操作主函数的具名返回值

定义`defer`的函数，即主函数可能有返回值，返回值有没有名字没有关系，`defer`所作用的函数，即延迟函数可能会影响到返回值。

若要理解延迟函数是如何影响主函数返回值的，只要明白函数是如何返回的就足够了。