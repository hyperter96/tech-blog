---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/go-cover1-slices.jpeg
date: 2022-07-08
tag:
  - Go
  - 编程基础
sticky: 1
prev:
  text: 'Go 基础知识系列四：接口interface'
  link: '/posts/programming/go/interface'
---

# Go 基础知识系列五：Channel

## 什么是 channel 管道

它是一个数据管道，可以往里面写数据，从里面读数据。

channel 是 goroutine 之间数据通信桥梁，而且是线程安全的。

channel 遵循先进先出原则。

写入，读出数据都会加锁。

channel 可以分为 3 种类型：

- 只读 channel，单向 channel
- 只写 channel，单向 channel
- 可读可写 channel

channel 还可按是否带有缓冲区分为：

- 带缓冲区的 channel，定义了缓冲区大小，可以存储多个数据
- 不带缓冲区的 channel，只能存一个数据，并且只有当该数据被取出才能存下一个数据

## channel 的基本使用

### 定义和声明

```go
// 只读 channel
var readOnlyChan <-chan int  // channel 的类型为 int

// 只写 channel
var writeOnlyChan chan<- int

// 可读可写
var ch chan int

// 或者使用 make 直接初始化
readOnlyChan1 := make(<-chan int, 2)  // 只读且带缓存区的 channel
readOnlyChan2 := make(<-chan int)   // 只读且不带缓存区 channel

writeOnlyChan3 := make(chan<- int, 4) // 只写且带缓存区 channel
writeOnlyChan4 := make(chan<- int) // 只写且不带缓存区 channel

ch := make(chan int, 10)  // 可读可写且带缓存区

ch <- 20  // 写数据
i := <-ch  // 读数据
i, ok := <-ch  // 还可以判断读取的数据
```

`chan_var.go`:
```go
package main

import (
    "fmt"
)

func main() {
    // var 声明一个 channel，它的零值是nil
    var ch chan int
    fmt.Printf("var: the type of ch is %T \n", ch)
    fmt.Printf("var: the val of ch is %v \n", ch)

    if ch == nil {
        // 也可以用make声明一个channel，它返回的值是一个内存地址
        ch = make(chan int)
        fmt.Printf("make: the type of ch is %T \n", ch)
        fmt.Printf("make: the val of ch is %v \n", ch)
    }

    ch2 := make(chan string, 10)
    fmt.Printf("make: the type of ch2 is %T \n", ch2)
    fmt.Printf("make: the val of ch2 is %v \n", ch2)
}

// 输出：
// var: the type of ch is chan int
// var: the val of ch is <nil>
// make: the type of ch is chan int
// make: the val of ch is 0xc000048060
// make: the type of ch2 is chan string
// make: the val of ch2 is 0xc000044060
```

### 操作channel的3种方式

操作 channel 一般有如下三种方式：

1. 读 `<-ch`
2. 写 `ch<-`
3. 关闭 `close(ch)`

|操作|`nil`的`channel`|正常的`channel`|已关闭的`channel`|
|----|----------------|--------------|----------------|
|读 `<-ch`|阻塞|成功或阻塞|读到零值|
|写 `ch<-`|阻塞|成功或阻塞|`panic`|
|关闭`close(ch)`|`panic`|成功|`panic`|

:::warning 注意📢：
对于 `nil` channel 的情况，有1个特殊场景：

当 `nil` channel 在 `select` 的某个 `case` 中时，这个 `case` 会阻塞，但不会造成死锁。
:::

### 单向的channel

> 单向 channel：只读和只写的 channel

`chan_uni.go`:
```go
package main

import "fmt"

func main() {
	// 单向 channel，只写channel
	ch := make(chan<- int)
	go testData(ch)
	fmt.Println(<-ch)
}

func testData(ch chan<- int) {
	ch <- 10
}

// 运行输出
// ./chan_uni.go:9:14: invalid operation: <-ch (receive from send-only type chan<- int)
// 报错，它是一个只写 send-only channel
```

把上面代码`main()`函数里初始化的单向channel，修改为可读可写channel，再运行

`chan_uni2.go`:
```go
package main

import "fmt"

func main() {
    // 把上面代码main()函数初始化的单向 channel 修改为可读可写的 channel
	ch := make(chan int)
	go testData(ch)
	fmt.Println(<-ch)
}

func testData(ch chan<- int) {
	ch <- 10
}

// 运行输出：
// 10

// 没有报错，可以正常输出结果
```

### 带缓冲和不带缓冲的 channel

#### 不带缓冲区 channel

`chan_unbuffer.go`:
```go
package main

import "fmt"

func main() {
    ch := make(chan int) // 无缓冲的channel
    go unbufferChan(ch)

    for i := 0; i < 10; i++ {
        fmt.Println("receive ", <-ch) // 读出值
    }
}

func unbufferChan(ch chan int) {
    for i := 0; i < 10; i++ {
        fmt.Println("send ", i)
        ch <- i // 写入值
    }
}

// 输出
send  0
send  1
receive  0
receive  1
send  2
send  3
receive  2
receive  3
send  4
send  5
receive  4
receive  5
send  6
send  7
receive  6
receive  7
send  8
send  9
receive  8
receive  9
```

#### 带缓冲区 channel

`chan_buffer.go`:
```go
package main

import (
	"fmt"
)

func main() {
	ch := make(chan string, 3)
	ch <- "tom"
	ch <- "jimmy"
	ch <- "cate"

	fmt.Println(<-ch)
	fmt.Println(<-ch)
	fmt.Println(<-ch)
}

// 运行输出：
// tom
// jimmy
// cate
```

再看一个例子：`chan_buffer2.go`
```go
package main

import (
	"fmt"
	"time"
)

var c = make(chan int, 5)

func main() {
	go worker(1)
	for i := 1; i < 10; i++ {
		c <- i
		fmt.Println(i)
	}
}

func worker(id int) {
	for {
		_ = <-c
	}
}

// 运行输出：
// 1
// 2
// 3
// 4
// 5
// 6
// 7
// 8
// 9
```

## 判断 channel 是否关闭

语法：
```go
v, ok := <-ch
```
说明：

- `ok` 为 `true`，读到数据，管道没有关闭
- `ok` 为 `false`，管道已关闭，没有数据可读

```go
// 代码片段例子
if v, ok := <-ch; ok {
    fmt.Println(v)
}
```
举一个完整例子：

```go
package main

import (
	"fmt"
)

func main() {
	ch := make(chan int)
	go test(ch)

	for {
		if v, ok := <-ch; ok {
			fmt.Println("get val: ", v, ok)
		} else {
			break
		}

	}
}

func test(ch chan int) {
	for i := 0; i < 5; i++ {
		ch <- i
	}
	close(ch)
}
```
读已经关闭的 channel 会读到零值，如果不确定 channel 是否关闭，可以用这种方法来检测。

## range and close

`range` 可以遍历数组，map，字符串，channel等。

一个发送者可以关闭 channel，表明没有任何数据发送给这个 channel 了。接收者也可以测试channel是否关闭，通过 `v, ok := <-ch` 表达式中的 `ok` 值来判断 channel 是否关闭。上一节已经说明 `ok` 为 `false` 时，表示 channel 没有接收任何数据，它已经关闭了。

:::warning 注意📢：
仅仅只能是发送者关闭一个 channel，而不能是接收者。给已经关闭的 channel 发送数据会导致 `panic`。
:::

> [!IMPORTANT] Note
> channels 不是文件，你通常不需要关闭他们。那什么时候需要关闭？当要告诉接收者没有值发送给 channel 了，这时就需要了。
>
> 比如终止 `range` 循环。

当 `for range` 遍历 channel 时，如果发送者没有关闭 channel 或在 `range` 之后关闭，都会导致 `deadlock`(死锁)。

下面是一个会产生死锁的例子：

```go
package main

import "fmt"

func main() {
	ch := make(chan int)

	go func() {
		for i := 0; i < 10; i++ {
			ch <- i
		}
	}()

	for val := range ch {
		fmt.Println(val)
	}
	close(ch) // 这里关闭channel已经”通知“不到range了，会触发死锁。
              // 不管这里是否关闭channel，都会报死锁，close(ch)的位置就不对。
              // 且关闭channel的操作者也错了，只能是发送者关闭channel
}
// 运行程序输出
// 0
// 1
// 2
// 3
// 4
// 5
// 6
// 7
// 8
// 9
// fatal error: all goroutines are asleep - deadlock!
```

改正也很简单，把 `close(ch)` 移到 `go func(){}()` 里，代码如下

```go
go func() {
    for i := 0; i < 10; i++ {
        ch <- i
    }
    close(ch)
}()
```

这样程序就可以正常运行，不会报 `deadlock` 的错误了。

把上面程序换一种方式来写，`chan_range.go`

```go
package main

import (
	"fmt"
)

func main() {
	ch := make(chan int)
	go test(ch)
	for val := range ch { //
		fmt.Println("get val: ", val)
	}
}

func test(ch chan int) {
	for i := 0; i < 5; i++ {
		ch <- i
	}
	close(ch)
}

// 运行输出：
// get val:  0
// get val:  1
// get val:  2
// get val:  3
// get val:  4
```

发送者关闭 channel 时，`for range` 循环自动退出。

## `for` 读取channel

用 `for` 来不停循环读取 channel 里的数据。

把上面的 `range` 程序修改下,`chan_for.go`

```go
package main

import (
	"fmt"
)

func main() {
	ch := make(chan int)
	go test(ch)

	for {
		val, ok := <-ch
		if ok == false {// ok 为 false，没有数据可读
			break // 跳出循环
		}
		fmt.Println("get val: ", val)
	}
}

func test(ch chan int) {
	for i := 0; i < 5; i++ {
		ch <- i
	}
	close(ch)
}

// 运行输出：
// get val:  0
// get val:  1
// get val:  2
// get val:  3
// get val:  4
```
## `select` 使用

例子 `chan_select.go`

```go
package main

import "fmt"

// https://go.dev/tour/concurrency/5
func fibonacci(ch, quit chan int) {
	x, y := 0, 1
	for {
		select {
		case ch <- x:
			x, y = y, x+y
		case <-quit:
			fmt.Println("quit")
			return
		}
	}
}

func main() {
	ch := make(chan int)
	quit := make(chan int)

	go func() {
		for i := 0; i < 10; i++ {
			fmt.Println(<-ch)
		}
		quit <- 0
	}()

	fibonacci(ch, quit)
}

// 运行输出：
// 0
// 1
// 1
// 2
// 3
// 5
// 8
// 13
// 21
// 34
// quit
```