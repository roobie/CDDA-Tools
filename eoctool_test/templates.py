from typing import Dict, List

from eoctool_test.CDDA import U


DEFAULT_Y = 100

type Expr = str | Dict[str, Expr] | int | float | List[Expr]


def math(expr: Expr) -> Dict[str, Expr]:
    if not isinstance(expr, list):
        expr = [expr]
    return {"math": expr}  # type: ignore


def condition_x_in_y(x: Expr, y: Expr) -> Dict[str, Dict[str, Expr]]:
    return {
        "x_in_y_chance": {
            "x": x,
            "y": y,
        }
    }


def if_then_else(
    id: str, condition: Dict[str, Expr], effect: Expr, false_effect: Expr | None = None
) -> Dict[str, Expr]:
    """
    Helper to build the condition dict for an x_in_y_chance check.
    Minimizes inline dictionary noise in tests.
    """
    result = {
        "id": id,
        "condition": condition,
        "effect": effect,
    }
    if false_effect is not None:
        result["false_effect"] = false_effect

    return result


def example1():
    tree = if_then_else(
        id="EOC_EXAMPLE_1",
        condition=condition_x_in_y(
            x=math(f"{U.Val.intelligence} * 2"),
            y=DEFAULT_Y,
        ),
        effect=math("u_add_morale('morale_study', 5, 5, 300, 10)"),
        false_effect=math("u_add_morale('morale_study', -5, 5, 300, 10)"),
    )
