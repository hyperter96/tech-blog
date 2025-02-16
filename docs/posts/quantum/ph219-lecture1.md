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

![]$https://quantum-book-by-originq.readthedocs.io/en/latest/_images/wps64.png$

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

对于微观量子而言，有一个决定粒子性质的最直接参量——能量。粒子的能量只会在几个分立的能级上面取值，限制取值的可能性种类为两种，这就构成了两能级系统。除了某些特殊的情况之外，这两个能级必定能找出来一个较低的，称之为基态$ground state$，记为 $|g\rangle$；另一个能量较高的，称之为激发态$excited state$，记为 $|e\rangle$。

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

假设：封闭的$closed$量子系统的演化 （Evoluation），由**酉变换**（Unitary Transformation）来描述，具体地，在 $t_1$ 时刻系统处于状态 $|\psi\rangle$，经过一个和时间 $t_1$ 和 $t_2$ 有关的酉矩阵 $U$，系统在 $t_2$ 时刻的状态：

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

可以定义测量就是将量子态 $|\psi\rangle$ 投影到另一个态 $|\alpha\rangle$ 上，获得这个态的概率是它们内积的平方，即

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

## 密度矩阵和布洛赫球（Density Matrix & Block Sphere）

态矢是对纯态的描述，如果要描述一个混合态，就必须写成态集合和概率的列表形式，非常繁琐。因此采用密度矩阵来描述。

对于一个纯态而言，密度矩阵的形式是：

$$
\begin{equation*}
\rho = |\psi\rangle\langle \psi|
\end{equation*}
$$

而对于一个混合态而言，密度矩阵的形式是：

$$
\begin{equation*}
\rho = \sum_i P_i |\psi_i\rangle\langle \psi_i|
\end{equation*}
$$

其中 $\{P_i,|\psi_i\rangle\}$ 是系统所处的态及其概率。

密度矩阵已经完备地表示了一个两能级系统可能出现的任何状态。为了更加直观地理解量子叠加态与逻辑门的作用，引入布洛赫球的概念，它能够方便地表示一个量子比特的任意状态。


![](https://quantum-book-by-originq.readthedocs.io/en/latest/_images/2.1.4.png)

对于混合态而言，因为根据之前的描述，混合态实际上是多个纯态的经典统计概率的叠加。对于每一个纯态分量，连接球心和球面上的点，可以形成一个矢量。根据概率列表，对所有的纯态矢量进行加权平均，即可得到混合态的矢量，即得到了混合态对应的点。

混合态是布洛赫球内部的点，根据混合的程度不同，矢量的长度也不同。最大混合态是球心，它意味着这里不存在任何量子叠加性。

在量子计算中，**观测量**和**计算基下的测量**是描述量子态信息提取的核心概念。以下结合定义与示例进行详细说明：

---

### **1. 观测量（Observable）**
#### **定义**
- **数学形式**：观测量是**厄米算符**（Hermitian Operator），记作 $\hat{O}$，满足 $\hat{O}^\dagger = \hat{O}$。
- **物理意义**：它的本征值对应测量结果的**可能取值**，本征态对应测量后的**坍缩状态**。
- **测量规则**：对量子态 $|\psi\rangle$ 测量 $\hat{O}$，结果为某个本征值 $o_i$，概率为 $|\langle \phi_i| \psi \rangle|^2$，其中 $|\phi_i\rangle$ 是 $\hat{O}$ 的本征态。

#### **示例**
考虑单量子比特的**泡利-Z算符** $\hat{O} = Z = \begin{bmatrix} 1 & 0 \\ 0 & -1 \end{bmatrix}$，其本征值为 $+1$ 和 $-1$，对应本征态为 $|0\rangle$ 和 $|1\rangle$。  
若量子态为 $|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$，则：
- 测得 $+1$ 的概率为 $|\alpha|^2$，坍缩到 $|0\rangle$；
- 测得 $-1$ 的概率为 $|\beta|^2$，坍缩到 $|1\rangle$。

---

### **2. 计算基下的测量**
#### **定义**
- **计算基**：量子比特的标准正交基，通常指 $|0\rangle = \begin{bmatrix} 1 \\ 0 \end{bmatrix}$ 和 $|1\rangle = \begin{bmatrix} 0 \\ 1 \end{bmatrix}$。
- **测量含义**：在计算基下的测量等价于对泡利-Z算符 $Z$ 的测量，结果对应比特值 $0$ 或 $1$，是量子计算中最常用的测量方式。

#### **测量步骤**
1. **量子态表示**：假设待测态为 $|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$。
2. **计算概率**：
   - 测得 $0$ 的概率为 $|\alpha|^2$，
   - 测得 $1$ 的概率为 $|\beta|^2$。
3. **坍缩**：测量后态变为对应的基矢（$|0\rangle$ 或 $|1\rangle$）。

---

### **3. 实例分析**
#### **例1：测量叠加态**
设量子态为 $|\psi\rangle = \frac{1}{\sqrt{2}}(|0\rangle + |1\rangle)$：
1. **计算基测量**：对 $Z$ 进行测量。
2. **概率结果**：
   - 测得 $0$ 的概率 $|\frac{1}{\sqrt{2}}|^2 = \frac{1}{2}$，
   - 测得 $1$ 的概率同样为 $\frac{1}{2}$。
3. **坍缩**：无论结果如何，测量后态必为 $|0\rangle$ 或 $|1\rangle$。

#### **例2：测量非计算基态**
若量子态为 $|+\rangle = \frac{|0\rangle + |1\rangle}{\sqrt{2}}$（对应布洛赫球的X方向）：
- **在计算基（Z方向）测量**：结果仍为 $0$ 或 $1$，各占50%概率。
- **若在X基（测量 $\hat{X}$）**：结果将确定性地得到 $+1$（对应 $|+\rangle$ 本身）。

### **4. 关键区别与意义**
- **观测量选择**：测量结果依赖于所选的厄米算符。例如：
  - 测量 $Z$（计算基）→ 获取比特信息；
  - 测量 $X$ 或 $Y$ → 获取量子态在X或Y方向的极化信息。
- **计算基的普适性**：量子算法（如Shor算法、Grover算法）的最终结果通常以计算基读取，因此计算基测量是量子计算的核心操作。

## **布洛赫矢量与量子态的对应关系**
单量子比特的任意纯态可表示为：
$$
\begin{equation*}
|\psi\rangle = \cos\left(\frac{\theta}{2}\right)|0\rangle + e^{i\phi}\sin\left(\frac{\theta}{2}\right)|1\rangle
\end{equation*}
$$
其对应的布洛赫矢量坐标为：
$$
\begin{equation*}
\mathbf{r} = (\sin\theta\cos\phi, \sin\theta\sin\phi, \cos\theta)
\end{equation*}
$$
其中：
- $\theta \in [0, \pi]$ 是极角（与Z轴的夹角）；
- $\phi \in [0, 2\pi)$ 是方位角（在XY平面的投影方向）。

---

## **X基态的定义**

X基态是泡利-X算符（$X = \begin{bmatrix} 0 & 1 \\ 1 & 0 \end{bmatrix}$）的本征态：
- **$|+\rangle$**：本征值 $+1$，对应态 $\frac{|0\rangle + |1\rangle}{\sqrt{2}}$；
- **$|-\rangle$**：本征值 $-1$，对应态 $\frac{|0\rangle - |1\rangle}{\sqrt{2}}$。

---

## **计算X基态的布洛赫坐标**
### **步骤1：将X基态标准化为布洛赫参数形式**
以 $|+\rangle = \frac{|0\rangle + |1\rangle}{\sqrt{2}}$ 为例：
$$
\begin{equation*}
|\psi\rangle = \frac{1}{\sqrt{2}}|0\rangle + \frac{1}{\sqrt{2}}|1\rangle
\end{equation*}
$$
对比一般形式 $|\psi\rangle = \cos\left(\frac{\theta}{2}\right)|0\rangle + e^{i\phi}\sin\left(\frac{\theta}{2}\right)|1\rangle$，可得：
$$
\begin{equation*}
\cos\left(\frac{\theta}{2}\right) = \frac{1}{\sqrt{2}}, \quad e^{i\phi}\sin\left(\frac{\theta}{2}\right) = \frac{1}{\sqrt{2}}
\end{equation*}
$$

### **步骤2：求解 $\theta$ 和 $\phi$**
1. **极角 $\theta$**：
   $$
   \begin{equation*}
   \cos\left(\frac{\theta}{2}\right) = \frac{1}{\sqrt{2}} \implies \frac{\theta}{2} = \frac{\pi}{4} \implies \theta = \frac{\pi}{2}
   \end{equation*}
   $$
2. **方位角 $\phi$**：
   $$
   \begin{equation*}
   e^{i\phi}\sin\left(\frac{\theta}{2}\right) = \frac{1}{\sqrt{2}} \implies e^{i\phi} \cdot \frac{1}{\sqrt{2}} = \frac{1}{\sqrt{2}} \implies e^{i\phi} = 1 \implies \phi = 0
   \end{equation*}
   $$

### **步骤3：代入布洛赫坐标公式**
$$
\begin{equation*}
\mathbf{r} = (\sin\theta\cos\phi, \sin\theta\sin\phi, \cos\theta)
\end{equation*}
$$
将 $\theta = \frac{\pi}{2}$ 和 $\phi = 0$ 代入：
$$
\begin{equation*}
\mathbf{r} = \left( \sin\frac{\pi}{2}\cos0, \sin\frac{\pi}{2}\sin0, \cos\frac{\pi}{2} \right) = (1 \cdot 1, 1 \cdot 0, 0) = (1, 0, 0)
\end{equation*}
$$
因此，$$|+\rangle$$ 对应布洛赫球上 **X轴右端点**（坐标为 $(1,0,0)$）。

同理，对 $|-\rangle = \frac{|0\rangle - |1\rangle}{\sqrt{2}}$，计算可得：
$$
\begin{equation*}
\cos\left(\frac{\theta}{2}\right) = \frac{1}{\sqrt{2}}, \quad e^{i\phi}\sin\left(\frac{\theta}{2}\right) = -\frac{1}{\sqrt{2}} \implies \phi = \pi
\end{equation*}
$$
此时：
$$
\begin{equation*}
\mathbf{r} = (\sin\theta\cos\phi, \sin\theta\sin\phi, \cos\theta) = (1 \cdot (-1), 1 \cdot 0, 0) = (-1, 0, 0)
\end{equation*}
$$
对应 **X轴左端点**（坐标为 $(-1,0,0)$）。

---

### **步骤4: 验证：通过布洛赫矢量公式直接计算**
对于任意量子态 $|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$，其布洛赫矢量 $\mathbf{r} = (r_x, r_y, r_z)$ 可定义为：
$$
\begin{equation*}
\begin{cases}
r_x = 2\,\text{Re}(\alpha\beta^*) \\
r_y = 2\,\text{Im}(\alpha\beta^*) \\
r_z = |\alpha|^2 - |\beta|^2
\end{cases}
\end{equation*}
$$

#### **以 $|+\rangle = \frac{1}{\sqrt{2}}(|0\rangle + |1\rangle)$ 为例**
- $\alpha = \frac{1}{\sqrt{2}}$，$\beta = \frac{1}{\sqrt{2}}$
- 计算分量：
  $$
  \begin{align*}
  r_x &= 2 \cdot \text{Re}\left(\frac{1}{\sqrt{2}} \cdot \frac{1}{\sqrt{2}}\right) = 2 \cdot \frac{1}{2} = 1\\
  r_y &= 2 \cdot \text{Im}\left(\frac{1}{\sqrt{2}} \cdot \frac{1}{\sqrt{2}}\right) = 0 \quad (\text{无虚部})\\
  r_z &= \left|\frac{1}{\sqrt{2}}\right|^2 - \left|\frac{1}{\sqrt{2}}\right|^2 = 0
  \end{align*}
  $$
最终得到 $\mathbf{r} = (1, 0, 0)$，即X轴右端点。

---

### **步骤5: 几何解释**
- **X轴对应测量方向**：当沿X轴方向（水平向右）测量时：
  - 本征态 $|+\rangle$ 和 $|-\rangle$ 分别位于X轴的正负端点。
  - 它们的布洛赫矢量方向与X轴一致，因此测量X方向时结果确定（无坍缩）。
- **与计算基（Z轴）的关系**：若对X基态进行Z方向（计算基）测量，量子态将坍缩到Z轴两极，体现出量子叠加态的随机性。

---


通过以上计算可明确:
**X基态在布洛赫球上的位置是通过量子态的数学表达与布洛赫矢量定义直接对应的**。理解这一过程是掌握量子态几何表示的关键。
