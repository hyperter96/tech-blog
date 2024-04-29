---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/go-cover1-slices.jpeg
date: 2022-07-10
tag:
  - Go
  - 编程基础
sticky: 1
prev:
  text: 'Go 基础知识系列五：Channel'
  link: '/posts/programming/go/channel'
next:
  text: 'Go 基础知识系列七：延迟函数调用Defer'
  link: '/posts/programming/go/defer'
---

# Go 基础知识系列六：互斥锁mutex

## `sync.Mutex` 互斥锁

`sync.Mutex` 是一个互斥锁，它的作用就是保护临界区，确保同一时间只有一个 Go 协程进入临界区。

什么是临界区？为什么有临界区？

> 在并发编程中，有一部分程序被并发访问，这个访问可能是多个协程/线程修改这部分程序数据，这样的操作会导致意想不到的结果，为了不让操作导致意外结果，怎么办？就需要把这部分程序保护起来，一次只允许一个协程/线程访问这部分区域。需要被保护的这部分程序区域就叫临界区。
>
> 防止多个协程/线程同时进入临界区，修改程序数据。

互斥锁就是一种可以保护临界区资源方式。

互斥锁其实是一种最特殊的信号量，这个"量"只有 0 和 1，所以也叫互斥量。互斥量的值为 0 和 1，用来表示加锁和解锁。互斥锁是一种独占锁，即同一时间只能有一个协程持有锁，其他协程必须等待。

互斥锁使得同一时刻只有一个协程执行某段程序，其他协程等待该协程执行完在抢锁后执行。

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/mutex-1.png)

如上图所示：`g1` 用互斥锁保护临界区，`g2` 在中间尝试获取锁失败，`g1` 离开临界区释放锁，`g2` 获取到锁然后进行相应操作，操作完后释放锁离开临界区。

> 第一次使用后不得复制 Mutex。

互斥锁使用：

- 互斥锁有两个方法 `Lock()` 加锁和 `Unlock()` 解锁，他们是成对出现。当一个协程对资源上锁后，其他协程只能等待该协程解锁之后，才能再次上锁。
- 它还有一个 `TryLock()`，go1.18 之后添加的。

    - 当一个 goroutine 调用此方法试图获取锁时，如果这把锁没有被其他 goroutine 持有，那么这个 goroutine 获取锁并返回 `true`；
    - 如果这把锁已经被其它 goroutine 持有，或正准备给某个唤醒的 gorouine，那么请求锁的 goroutine 直接返回 `false`，不会阻塞在方法调用上。

```bash
Lock()
代码段(临界区)
Unlock()
```

> 为了防止上锁后忘记释放锁，实际使用中用 `defer` 来释放锁。

> [!IMPORTANT] 例子
> ```go
> package main
>
> import (
> 	"fmt"
> 	"sync"
>	"time"
> )
>
> func main() {
> 	var a = 0
>
>	var lock sync.Mutex
>	for i := 0; i < 100; i++ { // 并发 100 个goroutine
>		go func(id int) {
>			lock.Lock()
>			defer lock.Unlock()
>			a += 1
>			fmt.Printf("goroutine %d, a=%d\n", id, a)
>		}(i)
>	}
>
>	time.Sleep(time.Second) //等待1秒， 确保所有的协程执行完
> }
> ```

## `sync.RWMutex` 读写锁

`sync.RWMutex` 读写锁，对数据操进加锁进一步细分，针对读操作和写操作分别进行加锁和解锁。

> 在读写锁下，读操作和读操作之间不互斥，多个写操作是互斥，读操作和写操作也是互斥。

- 当一个 goroutine 获取读锁之后，其它的 goroutine 此时想获取读锁，那么可以继续获取锁，不用等待解锁；此时想获取写锁，就会阻塞等待直到读解锁；
- 当一个 goroutine 获取写锁之后，其它的 goroutine 无论是获取读锁还是写锁，都会阻塞等待。

读写锁的好处：

> 多个读之间不互斥，读锁就可以降低对数据读取加互斥锁的性能损耗。而不像互斥锁那样对所有的数据操作，不管是读还是写，同等对待，都加一把大锁处理。
>
> 在读多写少的场景下，更适合用读写锁。

`RWMutex` 读写锁的方法：

> - Mutex 的加锁和解锁：`Lock()` 和 `Unlock()`
> - 只读加锁和加锁：`RLock()` 和 `RUnlock()`
>   - `RLock()` 加读锁时如果存在写锁，则不能加锁；当只有读锁或无锁时，可以加读锁，且读锁可以加载多个。
>   - `RUnlock()` 解读锁。没有读锁情况下调用 `RUlock()` 会导致 `panic`。
>
> 释放锁用 `defer` 来释放锁

```go
// 使用 RWMutex 的伪码，当然正式代码不会这样写，会用 defer 释放锁
mutex := sync.RWMutex{}

mutex.Lock()
// 操作的资源
mutex.Unlock()

mutex.RLock()
// 读的资源
mutex.RUlock()
```


> [!IMPORTANT] 例子
> ```go
> package main
>
> import (
> 	"fmt"
>	"sync"
>	"time"
> )
>
> var sum = 0
> var rwMutex sync.RWMutex
>
> func main() {
>	// 并发写
>	for i := 1; i <= 50; i++ {
>		go writeSum()
>	}
>
>	// 并发读
>	for i := 1; i <= 20; i++ {
>		go fmt.Println("readSum: ", readSum())
>	}
>
>	time.Sleep(time.Second * 2) // 防止主程序退出，子协程还没运行完
>	fmt.Println("end sum: ", sum)
> }
>
> func writeSum() {
>	rwMutex.Lock()         // 读写锁
>	defer rwMutex.Unlock() // 释放锁
>	sum += 1
> }
>
> func readSum() int {
>	rwMutex.RLock()         // 读写锁加读锁
>	defer rwMutex.RUnlock() // 释放读锁
>	return sum
> }
> ```