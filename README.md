# Rubric-Anchored Chatbot Feedback for Medical Interviews

 **Paper:** [_Anchoring Medical Chatbot Feedback: Balancing Usability and Evidentiary Reliability_](https://github.com/amshah1022/rubric_anchored_feedback/blob/fcf29f762c0478bc53fa8bb20e6092146316da98/Anchoring_Medical_Chatbot_Feedback_to_Human_Rubrics__A_Pilot_Toward_Reliable_Oversight.pdf)

 Rubric-anchored chatbot deployed on [MedSimAI](https://medsimai.com/) 

---

##  Overview
This project investigates how rubric anchoring can improve the reliability of chatbot-delivered feedback in medical education.  
We compare two systems for simulated patient interviews on MedSimAI:

- **Rubric-Anchored Chatbot** – feedback grounded in the *Medical Interview Rating Scale (MIRS)*.  
- **Generic GPT-Based Chatbot** – free-form reflective coaching without rubric alignment.  

---

## Repository Structure

- **dialogic-feedback.ts and intention-detector.ts**  
  Code for the current deployed chatbot (rubric-anchored).  
  -  Work in-progress and still catching up to prototype in robustness 
  - This is the version used in the pilot evaluation study (see paper).  


- **dialogic_feedback_chatbot.ipynb**  
  Original proof-of-concept chatbot.  
  - Most robust implementation to date 
  - Provides clear, rubric-anchored feedback 

- **Evaluating AI Feedback for Medical Student Interviews (Responses) - Form Responses 1.numbers**

  Results from study

  Some results inputted from Alina Shah's gmail account due to technical obstacles (senior doctors, computer issues, privacy concerns, etc) 

---

## Data Availability
This project is in preliminary stages and under continuous development.  
- Analysis code and results are constantly being revised and improved.  
- Updated versions will be pushed as the project matures.  
- For now, see the paper for the most accurate results and interpretation.

---

## Deployment
- All chatbots use OpenAI’s GPT-4.1 with structured prompts.  
- Current deployment is live through MedSimAI but still being modularized from the prototype.  
---

## Authors
This project was developed by: 
- Alina Shah (dialogic_feedback_chatbot.ipynb, rubric design, participant recruitment/interviewing, study design, writing)
- Yann Hicke (dialogic_feedback_chatbot.ipynb, rubric design, study design, participant interviewing)
- Siena Shah (writing, evaluations)
- Gianna Cox (writing, evaluations, participant recruitment) 

