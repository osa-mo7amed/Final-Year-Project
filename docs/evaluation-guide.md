# InternMatch — FYP2 Evaluation Guide & Methodology
**Objective 4 Deliverable: Recommendation Accuracy & Usability Testing**

---

## 1. Recommendation Accuracy Evaluation (Information Retrieval Metrics)

### 1.1 Methodology & Definitions
Because InternMatch is an educational decision-support matching system rather than a commercial platform with years of click-through logs, accuracy is evaluated using **Expert-Judged Information Retrieval Metrics** (Ricci et al., *Recommender Systems Handbook* [8]).

* **Precision@K ($P@K$):** The proportion of recommended opportunities in the top-$K$ rankings that are genuinely relevant to the student's background:
  $$P@K = \frac{|\text{Relevant Jobs in Top } K|}{K}$$
* **Recall@K ($R@K$):** The proportion of all relevant opportunities in the corpus surfaced in the top-$K$ recommendations:
  $$R@K = \frac{|\text{Relevant Jobs in Top } K|}{|\text{Total Relevant Jobs in Benchmark Corpus}|}$$
* **F1-Score@K ($F_1@K$):** The harmonic mean of Precision@K and Recall@K:
  $$F_1@K = 2 \cdot \frac{P@K \cdot R@K}{P@K + R@K}$$
* **Mean Average Precision (MAP):** The mean of Average Precision across all test profiles, assessing overall ranking quality:
  $$\text{MAP} = \frac{1}{|U|} \sum_{u=1}^{|U|} \text{AP}(u), \quad \text{AP}(u) = \frac{1}{|\text{Rel}(u)|} \sum_{k=1}^{N} P@k \cdot \text{rel}(k)$$

### 1.2 How to Execute the Accuracy Benchmark
1. Open `frontend/pages/evaluation-runner.html` in your browser.
2. Click **"▶ Run Accuracy Benchmark"**.
3. Capture the generated metrics summary table and include it in **Chapter 5 (Testing & Evaluation)** of your FYP2 report.

---

## 2. System Usability Scale (SUS) Testing Protocol

### 2.1 Sample Size & Target Population
* **Sample Size ($N$):** 30 participants (target university students and recent fresh graduates matching the Chapter 3 survey demographic).
* **Task Scenario:**
  1. **Task 1:** Register a new student account (`register.html`).
  2. **Task 2:** Complete academic profile and add at least 3 technical skills and 2 soft skills (`profile.html`).
  3. **Task 3:** Inspect the personalized recommendation feed on the dashboard and observe the match scores (`dashboard.html`).
  4. **Task 4:** Open the Skill Alignment analysis for a high-scoring role, inspect matched vs missing competencies, and review the improvement suggestions (`skill-analysis.html`).
  5. **Task 5:** Search for a specific role and filter by industry and required skills (`search.html`).

### 2.2 Standard 10-Item SUS Questionnaire (Brooke, 1996)
Participants rate each item on a 5-point Likert scale (1 = Strongly Disagree, 5 = Strongly Agree):

1. I think that I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think that I would need the support of a technical person to be able to use this system.
5. I found the various functions in this system were well integrated.
6. I thought there was too much inconsistency in this system.
7. I would imagine that most people would learn to use this system very quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot of things before I could get going with this system.

### 2.3 SUS Calculation Formula
For each participant's response $R_i \in [1, 5]$:
$$\text{Item Contribution (Odd Items } 1, 3, 5, 7, 9): X_i = R_i - 1$$
$$\text{Item Contribution (Even Items } 2, 4, 6, 8, 10): Y_i = 5 - R_i$$
$$\text{SUS Score} = \left( \sum X_i + \sum Y_i \right) \times 2.5$$

### 2.4 Interpretation Benchmark
* **Score $\ge 80.3$:** Grade A (Exceptional usability)
* **Score $68.0 - 80.2$:** Grade B (Good to Excellent usability — target benchmark)
* **Score $51.0 - 67.9$:** Grade C (Marginal / Needs minor refinement)
* **Score $< 51.0$:** Grade F (Unacceptable usability)
