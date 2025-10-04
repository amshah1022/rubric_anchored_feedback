# Rubric-Anchored Chatbot Feedback for Medical Interviews

 **Paper:** Anchoring Medical Chatbot Feedback: Balancing Usability and Evidentiary Reliability

---

##  Overview
This project investigates how **rubric anchoring** can improve the reliability of chatbot-delivered feedback in medical education.  
We compare two systems for simulated patient interviews on MedSimAI:

- **Rubric-Anchored Chatbot** – feedback grounded in the *Medical Interview Rating Scale (MIRS)*.  
- **Generic GPT-Based Chatbot** – free-form reflective coaching without rubric alignment.  

---

## Repository Structure

- **dialogic-feedback.ts and intention-detector.ts**  
  Code for the current deployed chatbot (rubric-anchored).  
  -  Work in-progress and still catching up to prototype in robustness 
  - This is the version used in the pilot evaluation study (see paper).  


- **dialogic_feedback_chatbot.py**  
  Original proof-of-concept chatbot.  
  - Most robust implementation to date 
  - Provides clear, rubric-anchored feedback 

---

## Data Availability
This project is in **preliminary stages** and under continuous development.  
- Analysis code and results are **constantly being revised and improved**.  
- Updated versions will be pushed as the project matures.  
- For now, see the paper for the most accurate results and interpretation.

---

## Deployment
- All chatbots use **OpenAI’s GPT-4.1** with structured prompts.  
- Current deployment is live through MedSimAI but still being modularized from the prototype.  
---

## Acknowledgments
This project is part of ongoing research at Cornell University.  
Co-authors: Yann Hicke, Siena Shah, Gianna Cox
Correspondence: **alina.shah1022@gmail.com*
