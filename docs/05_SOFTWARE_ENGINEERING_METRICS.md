# Software Engineering Process Metrics Engine: Mathematical Specification & Formal Definitions

## 1. Overview
The **Software Metrics Engine** calculates quantitative indicators of engineering workflow health, process efficiency, and deliverable quality. All calculations are executed directly on relational database records (`tasks`, `task_status_history`, and `defects`) without artificial static numbers or mock data.

> **Academic Measurement Disclaimer:** In accordance with standard Software Engineering measurement ethics, process metrics (such as Throughput or Completion Rate) are designed to monitor **project flow health, system bottlenecks, and delivery cadence**. They must **never** be used as an objective measure of individual engineer competency, as task complexity, external dependencies, and technical risk vary widely.

---

## 2. Core Metrics Mathematical Specifications

### Metric A: Task Completion Rate ($R_{comp}$)

#### 1. Definition & Formula
The proportion of scoped, active engineering tasks that have successfully reached terminal completion.

$$R_{comp} = \begin{cases} \left( \frac{N_{completed}}{N_{eligible}} \right) \times 100, & \text{if } N_{eligible} > 0 \\ 0.0, & \text{if } N_{eligible} = 0 \end{cases}$$

#### 2. Eligible Tasks ($N_{eligible}$)
- Tasks where `is_deleted = 0` **AND** `status != 'cancelled'`.
- **Treatment of Cancelled Tasks:** Cancelled tasks represent work that was discarded or de-scoped by managers. Including cancelled tasks in the denominator would falsely deflate team completion performance.
- **Treatment of Soft-Deleted Tasks:** Soft-deleted tasks (`is_deleted = 1`) represent erroneous entries and are completely excluded from both numerator and denominator.

#### 3. Completed Eligible Tasks ($N_{completed}$)
- Tasks where `is_deleted = 0` **AND** `status = 'completed'`.

---

### Metric B: Average Cycle Time ($\overline{T}_{cycle}$)

#### 1. Definition & Formula
The average duration elapsed between the timestamp when an engineer formally commenced work on a task until the task reached completion status.

$$\overline{T}_{cycle} = \begin{cases} \frac{1}{K} \sum_{i=1}^{K} \left( T_{completed, i} - T_{started, i} \right), & \text{if } K > 0 \\ 0.0, & \text{if } K = 0 \end{cases}$$

Where:
- $K$ is the total count of completed tasks with valid, non-null timestamps.
- $T_{completed, i}$ is the ISO-8601 timestamp stored in `completed_at`.
- $T_{started, i}$ is the ISO-8601 timestamp stored in `started_at`.
- Duration is expressed in **decimal hours** for engineering precision.

#### 2. Boundary Cases & Data Sanitation
- If $T_{completed} < T_{started}$ (due to erroneous system clock manipulation), the data row is rejected from the average.
- Tasks in `todo` or `in_progress` have incomplete lifecycles and are not counted in the cycle time calculation.

---

### Metric C: Task Throughput ($TP$)

#### 1. Definition & Formula
The absolute volume of verified deliverables completed during an evaluated reporting period $[t_{start}, t_{end}]$.

$$TP = \sum_{i \in \text{Tasks}} \mathbb{I}\left( \text{status}_i = \text{'completed'} \land t_{start} \le T_{completed, i} \le t_{end} \land \text{is\_deleted}_i = 0 \right)$$

Where $\mathbb{I}$ is the indicator function evaluating to 1 when the condition is met and 0 otherwise.

---

### Metric D: Overdue Task Count ($N_{overdue}$)

#### 1. Definition & Formula
The count of active, non-cancelled software tasks whose committed deadlines have passed without completion.

$$N_{overdue} = \sum_{i \in \text{Tasks}} \mathbb{I}\left( \text{status}_i \in \{\text{'todo'}, \text{'in\_progress'}\} \land T_{due, i} < T_{now} \land \text{is\_deleted}_i = 0 \right)$$

#### 2. Data Treatment
- Completed tasks whose historical deadline was in the past are **not** marked overdue once finished.
- Tasks with null due dates are considered backlog items without deadlines and are excluded.

---

### Metric E: Defect Rate ($R_{defect}$)

#### 1. Definition & Formula
The percentage of completed software units that were associated with at least one recorded software defect or bug.

$$R_{defect} = \begin{cases} \left( \frac{N_{completed\_with\_defects}}{N_{completed}} \right) \times 100, & \text{if } N_{completed} > 0 \\ 0.0, & \text{if } N_{completed} = 0 \end{cases}$$

#### 2. Data Treatment
- Evaluated strictly against completed deliverables to measure quality at release.
- Tasks encountering multiple defects increment $N_{completed\_with\_defects}$ by exactly 1 (measuring defective tasks rather than defect density).

---

### Metric F: Rework Rate ($R_{rework}$)

#### 1. Definition & Formula
The frequency with which tasks originally marked completed were subsequently reopened due to verification failure, regression, or missing acceptance criteria.

$$R_{rework} = \begin{cases} \left( \frac{N_{reopened}}{N_{ever\_completed}} \right) \times 100, & \text{if } N_{ever\_completed} > 0 \\ 0.0, & \text{if } N_{ever\_completed} = 0 \end{cases}$$

#### 2. Audit Trail Calculation
- $N_{ever\_completed}$: Count of unique task IDs present in `task_status_history` where `new_status = 'completed'` (or currently completed).
- $N_{reopened}$: Count of unique task IDs containing a historical transition row where `old_status = 'completed'` and `new_status \in {'todo', 'in_progress'}`.

---

### Metric G: Workload Distribution ($W_u$)

#### 1. Definition & Formula
The distribution of active engineering load across the registered developer team.

$$W_u = \sum_{i \in \text{Tasks}} \mathbb{I}\left( \text{status}_i \in \{\text{'todo'}, \text{'in\_progress'}\} \land \text{assignee}_i = u \land \text{is\_deleted}_i = 0 \right)$$

Evaluated for all active users $u \in \text{Users}$, plus the unassigned pool where $\text{assignee}_i = \text{NULL}$.
