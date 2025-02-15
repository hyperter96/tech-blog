---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/quantum_computing_future.jpg
date: 2025-2-7
tag:
  - 量子计算
sticky: 1
---

# 量子计算课程Ph219第一讲-量子系统介绍

## 测量和坍缩

薛定谔宣称，不打开盒子，猫就处于生和死的“叠加态”，又称：“当我们打开盒子，经过了我们的观察，猫就会坍缩到一个确定的生、死状态上”。

![](https://quantum-book-by-originq.readthedocs.io/en/latest/_images/wps64.png)

什么叫做“观察”之后“坍缩”到确定的状态上？难道不是这个装置而是第一个看到猫的人决定了猫的生死吗？

这里提出量子的第四个特性：“测量和坍缩假设”。测量和坍缩对量子态的影响仍然是一个争议话题，所以用了“假设”。这个特性的描述如下： 对于一个叠加态而言，可以去测量它，测量的结果一定是这一组量子化之后的、确定的、分立的态中的一个。测量得到任意的态的概率是这个叠加态和测量态的内积的平方，测量之后，叠加态就会坍缩到这个确定的态之上。

简而言之，如果在一个微观粒子处在1楼和2楼叠加态的话，只能测出来它在1楼或者2楼，这个概率是由它们的叠加权重决定的，但是一旦对这个粒子进行测量，这个粒子的状态就会发生变化，不再是原来那个既在1楼又在2楼的叠加态，而是处在一个确定的状态（1楼或者2楼）。换句话说，测量影响了这个粒子本身的状态。   

在上一节中，已经说明了叠加本身是一种客观存在的现象，那么测量、观察这种主观的事情是如何影响到客观叠加的呢？

比较主流的理论是说因为微观粒子太小，测量仪器本身会对这个粒子产生一定的影响，导致粒子本身发生了变化。但是没有足够的证据证明这种说法。

### 态矢（State Vector）

量子态可用线性代数中的向量来描述，在物理学中，向量常称作矢量。在量子理论中，描述量子态的向量称为态矢，态矢分为左矢（**bra**）和右矢（**ket**）。

右矢：

$$
\begin{equation*}
|\psi\rangle = [c_1, \cdots, c_n]^T
\end{equation*}
$$

左矢：

$$
\begin{equation*}
\langle\psi| = [c_1^\ast, \cdots, c_n^\ast]
\end{equation*}
$$

采用竖线和尖括号的组合描述一个量子态，其中每一个分量都是复数，右上角标 $T$ 表示转置。这种形式表示量子态是一个矢量。右矢表示一个 $n \times 1$ 的列矢量，左矢表示一个 $1 \times n$ 的行矢量。另外，在讨论同一个问题时，如果左矢和右矢在括号内的描述相同的话，那么这两个矢量互为转置共轭。

### 内积和外积（Inner Product & Outer Product）

对于任意的两个量子态的矩阵（坐标）表示如下：

$$
\begin{align*}
|\alpha\rangle &= [a_1, \cdots, a_n]^T\\
|\beta\rangle &= [b_1, \cdots, b_n]^T
\end{align*}
$$

其内积定义为：

$$
\begin{equation*}
\langle \alpha | \beta \rangle = \sum_{i=1}^n a_i^\ast b_i
\end{equation*}
$$

其外积定义为：

$$
\begin{equation*}
| \alpha \rangle \langle \beta | = [a_ib_j^\ast]_{n\times n}
\end{equation*}
$$

表示一个 $n \times n$ 矩阵。

## 两能级系统（Two Level System）

事物的二元化：0和1、无和有、高和低、开和关、天和地、阴和阳、生和死、产生和消灭。二元化是一种将事物关系简化的哲学，基于二进制的计算理论正是利用了这种哲学思想。

对于微观量子而言，有一个决定粒子性质的最直接参量——能量。粒子的能量只会在几个分立的能级上面取值，限制取值的可能性种类为两种，这就构成了两能级系统。除了某些特殊的情况之外，这两个能级必定能找出来一个较低的，称之为基态(ground state)，记为 $|g\rangle$；另一个能量较高的，称之为激发态(excited state)，记为 $|e\rangle$。

量子计算机里面也由两种状态来构成基本计算单元，只不过这里的两种状态是指量子态的 $|g\rangle$ 和 $|e\rangle$ , 这就是一个两能级系统的特征。以列矢量的方式将它们记为：

$$
\begin{equation*}
|e\rangle = \begin{bmatrix}
           1 \\
           0
\end{bmatrix}, |g\rangle = \begin{bmatrix}
0 \\
1
\end{bmatrix}
\end{equation*}
$$

和经典的比特类比，常将 $|e\rangle$ 记做 $|0 \rangle$ ，将 $|g\rangle$ 记做 $|1\rangle$ 并称为**量子比特**（quantum bits）。

任意叠加态（superposition）$\psi$ 可以写作 $|0\rangle$ 和 $|1\rangle$ 的线性组合：

$$
\begin{equation*}
|\psi\rangle = \alpha |0\rangle + \beta |1\rangle
\end{equation*}
$$

## 状态的演化（Evoluation of State）

量子态可以由态矢（或称向量）来表示，量子也可以有不同的状态，并且可以同时处于不同的状态，那么量子态是如何随时间演化呢？如下例：

假设：封闭的(closed)量子系统的演化 （Evoluation），由**酉变换**（Unitary Transformation）来描述，具体地，在 $t_1$ 时刻系统处于状态 $|\psi\rangle$，经过一个和时间 $t_1$ 和 $t_2$ 有关的酉矩阵 $U$，系统在 $t_2$ 时刻的状态：

$$
\begin{equation*}
|\psi_2 \rangle = U|\psi_1\rangle
\end{equation*}
$$

这里的酉变换 $U$ 可以理解为是一个矩阵，并且满足

$$
\begin{equation*}
UU^\dagger = I
\end{equation*}
$$

其中 $U^\dagger$ 表示对矩阵 $U$ 取转置共轭。根据可逆矩阵的定义，$U$ 也是一个可逆矩阵，因此酉变换也是一个可逆变换。

在量子计算中，各种形式的酉矩阵被称为**量子们**。例如Pauli矩阵也是一组酉矩阵，以 $X$ 门作用在量子态上为例：

$$
\begin{align*}
X|0\rangle &= 
\begin{bmatrix}
0 & 1\\
1 & 0
\end{bmatrix}
\cdot
\begin{bmatrix}
1\\
0
\end{bmatrix}
=
\begin{bmatrix}
0\\
1
\end{bmatrix}
= |1\rangle\\
X|1\rangle &=
\begin{bmatrix}
0 & 1\\
1 & 0
\end{bmatrix}
\cdot
\begin{bmatrix}
0\\
1
\end{bmatrix}
=
\begin{bmatrix}
1\\
0
\end{bmatrix}
= |0\rangle\\
X|\psi \rangle &=
\begin{bmatrix}
0 & 1\\
1 & 0
\end{bmatrix}
\cdot
\begin{bmatrix}
\alpha\\
\beta
\end{bmatrix}
=
\begin{bmatrix}
\beta\\
\alpha
\end{bmatrix}
\end{align*}
$$

从上述中看出，量子态的演化本质上可以看作是对量子态对应的矩阵做变换，即是做矩阵的乘法。 由于 $X$ 门和经典逻辑门中的非门类似，有时也常称 $X$ 门为**量子非门** （quantum NOT gate）。

## 叠加态和测量（Superposition & Measurement）

按照态矢的描述，这两个矢量可以构成一个二维空间的基。任何一个态都可以写为这两个基在复数空间上的线性组合，即

$$
\begin{equation*}
|\psi\rangle = \alpha |0\rangle + \beta e^{i\theta} |1\rangle
\end{equation*}
$$

可以定义测量就是将量子态 $|\psi$ 投影到另一个态 $|\alpha$ 上，获得这个态的概率是它们内积的平方，即

$$
\begin{equation*}
P_\alpha = |\langle \psi | \alpha \rangle |^2
\end{equation*}
$$

其它概率下会将量子态投影到它的正交态上去，即

$$
\begin{equation*}
P_{\alpha\perp} = 1 - P_\alpha
\end{equation*}
$$

测量之后量子态就坍缩到测量到的态上。
