def generate_genai_explanation(employee, dept, shift, hours, tasks, score, status):
    """
    Simulated Generative AI using prompt-style dynamic reasoning
    """

    # 🧠 Build prompt (important part — THIS is Gen AI concept)
    prompt = f"""
    Analyze workforce assignment:

    Employee: {employee}
    Department: {dept}
    Shift: {shift}
    Hours Worked: {hours}
    Tasks Completed: {tasks}
    Workload Score: {score}
    Status: {status}

    Generate a 2-line explanation:
    1. Why this shift is assigned
    2. Performance insight
    """

    # 🔥 Dynamic reasoning logic (not static)
    if status == "Overloaded":
        reason = f"{employee} is already handling {hours} hours and {tasks} tasks, indicating high workload pressure."
        action = f"Assigning {shift} shift helps balance operational demand but may require redistribution."

    elif status == "Underutilized":
        reason = f"{employee} has lower workload ({hours}h, {tasks} tasks), making them suitable for additional responsibilities."
        action = f"This shift improves resource utilization in {dept}."

    else:
        reason = f"{employee} has balanced workload with {hours} hours and {tasks} tasks."
        action = f"The shift aligns well with current department demand."

    performance = (
        "Performance is above average."
        if score > 8 else
        "Performance is stable."
        if score > 5 else
        "Performance needs improvement."
    )

    # ✨ Final generated output (dynamic, contextual)
    explanation = f"{reason} {action} {performance}"

    return explanation.strip()