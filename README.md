# Rubric-Anchored Chatbot Feedback for Medical Interviews

**Paper:** [_Anchoring Medical Chatbot Feedback to Human Rubrics: A Pilot Toward Reliable Oversight_](https://github.com/amshah1022/rubric_anchored_feedback/blob/fcf29f762c0478bc53fa8bb20e6092146316da98/Anchoring_Medical_Chatbot_Feedback_to_Human_Rubrics__A_Pilot_Toward_Reliable_Oversight.pdf)  
**Authors:** Alina Shah, Yann Hicke, Siena Shah (Cornell University) · Gianna Cox (UIUC)  
**Date:** October 2025  
**Deployment:** [MedSimAI](https://medsimai.com/)  
**IRB:** Cornell University Protocol #607-255-6182  

---

## Overview

This project develops and evaluates a rubric-anchored chatbot that delivers structured, auditable feedback for simulated medical interviews on _MedSimAI_.  
It addresses a core oversight gap in AI-assisted education: chatbot feedback often sounds confident but lacks grounding in validated rubrics, making it untrustworthy for training or assessment.

We compare two feedback systems:

| System | Description |
|---------|--------------|
| **Rubric-Anchored Chatbot** | Feedback explicitly grounded in the Medical Interview Rating Scale (MIRS), a validated framework for communication skills. Each feedback item is tied to rubric criteria like empathy, organization, and agenda-setting. |
| **Generic GPT-Based Chatbot** | Reflective but free-form feedback, unconstrained by rubric alignment. |

**Goal:** demonstrate how rubric anchoring transforms AI feedback from persuasive conversation into structured, evidence-grounded evaluation that is interpretable, reproducible, and auditable.

---

## Study Design

- **Participants:** 21 medical learners (students, residents, physician assistants, physicians) across UIC, Loyola, and LECOM.  
- **Design:** within-subjects; each participant interacted with both chatbots after a standardized patient interview (dyspnea case).  
- **Rubric Framework:** MIRS dimensions aligned with the _Kalamazoo Essential Elements Communication Checklist_ (Makoul, 1999).  
- **Model:** GPT-4.1 (OpenAI API, April 2025 release).  
- **Controls:** identical transcripts, generation parameters, and first-pass outputs retained for all ratings.  

The rubric-anchored chatbot required the model to map transcript events to MIRS categories before generating feedback, reducing hallucinations and improving traceability.

---

## Evaluation Dimensions

Participants rated both systems along validated feedback dimensions, including:  
- **Specificity** – precision and behavior-level commentary  
- **Actionability** – presence of clear, feasible next steps  
- **Alignment with Learning Goals** – adherence to rubric-defined domains  
- **Constructive Balance** – balance of strengths and growth areas  
- **Clarity / Cognitive Load** – readability and focus  
- **Accuracy / Evidence Grounding** – faithfulness to transcript  
- **Clinical / Safety Appropriateness** – avoidance of unsafe suggestions  

Additionally, qualitative questions captured open-text reflections and chatbot preference rationale.

---

## System Architecture

- **Model:** GPT-4.1  
- **Prompt Structure:** reflection → rubric mapping → feedback → goal-setting  
- **Temperature:** 0.7 · **Max tokens:** 650  
- **Deployment:** live via [MedSimAI](https://medsimai.com/)  
- **Future Enhancements:** integration with retrieval-based verification and automatic rubric scoring pipelines

---

## Repository Structure

| File | Purpose |
|------|----------|
| `dialogic-feedback.ts` / `intention-detector.ts` | Core backend for the rubric-anchored chatbot deployed on MedSimAI. Used in pilot evaluation. |
| `dialogic_feedback_chatbot.ipynb` | Original prototype notebook. Contains the most robust rubric alignment implementation. |
| `Evaluating AI Feedback for Medical Student Interviews (Responses).numbers` | Study responses; partial manual entry due to privacy and hardware constraints. |

---

## Data Availability

Study materials and analysis code are available in this repository and are being actively maintained.  
Analyses reported in the paper reflect the version current as of October 4 2025.  
Future updates will include full prompt templates, anonymized transcripts, and replication scripts.

---

## Research Context

This work forms the human-feedback calibration layer of a broader *AI Reliability Infrastructure*:

| Layer | Project | Focus |
|-------|----------|-------|
| Evidence-Grounded Verification | [Truth Layer](https://github.com/amshah1022/truth-layer) | Verifying factual accuracy via retrieval + NLI |
| Mechanistic Interpretability | ProbeEng | Layer-wise probing for internal representations |
| Human-Feedback Calibration | Rubric-Anchored Chatbot | Aligning model feedback with validated rubrics |

Together, these efforts aim to make AI systems accountable, auditable, and trustworthy—moving from surface-level fluency to measurable reliability.

---

## Authors

- **Alina Shah** — Lead developer, rubric design, participant recruitment, study design, writing  
- **Yann Hicke** — Co-developer, rubric design, study design, interviewing  
- **Siena Shah** — Writing, evaluation support  
- **Gianna Cox** — Writing, participant coordination  

---

*Contact:* **Alina Miret Shah** · [LinkedIn](https://www.linkedin.com/in/alinamshah/)  
*This work was conducted under the supervision of the Cornell University IRB (Protocol #607-255-6182).*

