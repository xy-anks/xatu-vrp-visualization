from backend.utils.campus_loader import create_campus_problem
from backend.utils.problem_adapter import convert_problem_to_solver_input


if __name__=="__main__":

    problem=create_campus_problem(
        "data/campus.json"
    )


    data=convert_problem_to_solver_input(problem)


    print(data)