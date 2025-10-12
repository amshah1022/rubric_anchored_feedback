# Rubric-Anchored Chatbot Feedback for Medical Interviews

**Paper:** [_Anchoring Medical Chatbot Feedback: Balancing Usability and Evidentiary Reliability_](https://github.com/amshah1022/rubric_anchored_feedback/blob/fcf29f762c0478bc53fa8bb20e6092146316da98/Anchoring_Medical_Chatbot_Feedback_to_Human_Rubrics__A_Pilot_Toward_Reliable_Oversight.pdf)  
**Deployment:** [MedSimAI](https://medsimai.com/)

---

## Overview
This project builds and evaluates a rubric-anchored chatbot that delivers structured feedback to medical students during simulated patient interviews.  
It tests whether explicit rubric alignment improves feedback reliability, clarity, trustworthiness, and more compared to free-form GPT coaching.

| System | Description |
|---------|--------------|
| **Rubric-Anchored Chatbot** | Feedback grounded in the *Medical Interview Rating Scale (MIRS)*; every statement is linked to a rubric criterion. |
| **Generic GPT-Based Chatbot** | Reflective coaching without rubric grounding. |

**Goal:** bridge usability and evidentiary reliability—turning reflective coaching into a measurable, auditable process.

---

## 🧠 Key Results (Pilot)
- Reduced unsupported feedback by **62%** vs. generic GPT.  
- Achieved **κ = 0.82** inter-rater reliability with senior clinicians.  
- Participants rated rubric-anchored feedback **+31% clearer** and **+24% more trustworthy.**

---

## ⚙️ System Architecture
- **Model:** GPT-4.1 (OpenAI API)  
- **Prompting:** Structured, rubric-grounded templates  
- **Deployment:** Live on MedSimAI (prototype modularization in progress)  
- **Planned Enhancements:** Retrieval-linked evidence verification and adaptive scoring calibration  

---

## 🧩 Repository Structure
| File | Role |
|------|------|
| `dialogic-feedback.ts`, `intention-detector.ts` | Core backend for deployed chatbot (rubric-anchored). Used in pilot evaluation study. |
| `dialogic_feedback_chatbot.ipynb` | Original proof-of-concept. Most robust implementation with full rubric alignment logic. |
| `Evaluating AI Feedback for Medical Student Interviews (Responses).numbers` | Pilot study data (partially manually entered due to privacy and hardware constraints). |

---

## 📂 Data Availability
This repository is under **active development.**  
Updated code and analysis will be released as the study is replicated and scaled.  
For now, refer to the [paper](https://github.com/amshah1022/rubric_anchored_feedback/blob/fcf29f762c0478bc53fa8bb20e6092146316da98/Anchoring_Medical_Chatbot_Feedback_to_Human_Rubrics__A_Pilot_Toward_Reliable_Oversight.pdf) for validated results and methodology.

---

## 🧭 Research Context
This work forms the **human-feedback calibration layer** of a broader reliability stack:

| Layer | Project | Focus |
|-------|----------|-------|
| Evidence-Grounded Verification | [Truth Layer](https://github.com/amshah1022/truth-layer) | Auditing factual accuracy |
| Mechanistic Interpretability | ProbeEng | Layer-wise probe evaluation |
| Human-Feedback Calibration | Rubric-Anchored Chatbot | Aligning model feedback with expert rubrics |

Together, these efforts operationalize **AI Reliability Infrastructure**—a framework for making alignment *measurable, interpretable, and auditable.*

---

## 👥 Authors
- **Alina Shah** — Lead developer, rubric design, participant recruitment, study design, writing  
- **Yann Hicke** — Co-developer, rubric design, methodology, interviewing  
- **Siena Shah** — Writing, evaluation support  
- **Gianna Cox** — Writing, participant coordination  

---

📘 *Contact:* **Alina Miret Shah** · [LinkedIn](https://www.linkedin.com/in/alina-miret)


