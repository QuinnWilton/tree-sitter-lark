/// <reference types="tree-sitter-cli/dsl" />

module.exports = grammar({
  name: "lark",

  extras: ($) => [/\s/, $.comment],

  rules: {
    source_file: ($) => repeat($._definition),

    _definition: ($) => $.let_definition,

    let_definition: ($) =>
      seq("let", field("name", $.identifier), "=", field("value", $._expression)),

    _expression: ($) =>
      choice(
        $.binary_expression,
        $.unary_expression,
        $.if_expression,
        $.let_expression,
        $.fn_expression,
        $.application,
        $.parenthesized_expression,
        $.integer,
        $.boolean,
        $.identifier
      ),

    binary_expression: ($) => {
      const ops = [
        ["+", 4],
        ["-", 4],
        ["*", 5],
        ["/", 5],
        ["==", 3],
        ["<", 3],
        [">", 3],
        ["and", 2],
        ["or", 1],
      ];
      return choice(
        ...ops.map(([op, p]) =>
          prec.left(
            p,
            seq(
              field("left", $._expression),
              field("operator", op),
              field("right", $._expression)
            )
          )
        )
      );
    },

    unary_expression: ($) =>
      choice(
        prec(6, seq("-", field("operand", $._expression))),
        prec(6, seq("not", field("operand", $._expression)))
      ),

    if_expression: ($) =>
      seq(
        "if",
        field("condition", $._expression),
        "then",
        field("consequence", $._expression),
        "else",
        field("alternative", $._expression)
      ),

    let_expression: ($) =>
      seq(
        "let",
        field("name", $.identifier),
        "=",
        field("value", $._expression),
        "in",
        field("body", $._expression)
      ),

    fn_expression: ($) =>
      seq(
        "fn",
        "(",
        field("parameters", optional($.parameter_list)),
        ")",
        "->",
        field("body", $._expression)
      ),

    parameter_list: ($) => seq($.identifier, repeat(seq(",", $.identifier))),

    application: ($) =>
      prec.left(
        7,
        seq(
          field("function", $._expression),
          "(",
          field("arguments", optional($.argument_list)),
          ")"
        )
      ),

    argument_list: ($) => seq($._expression, repeat(seq(",", $._expression))),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    integer: ($) => /[0-9]+/,

    boolean: ($) => choice("true", "false"),

    identifier: ($) => /[a-z_][a-zA-Z0-9_]*/,

    comment: ($) => seq("#", /.*/),
  },
});
