package com.example.dockerhub_clone.analytics;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class LogQueryParser {

    public ParseResult parse(String input) {
        if (!StringUtils.hasText(input)) {
            throw new IllegalArgumentException("Query cannot be empty");
        }

        Parser parser = new Parser(input);
        Node root = parser.parseExpression();
        parser.expect(TokenType.EOF, "Unexpected token after end of expression");

        String translated = root.toQueryString();
        if (translated.startsWith("(") && translated.endsWith(")")) {
            translated = translated.substring(1, translated.length() - 1);
        }

        return new ParseResult(translated);
    }

    public record ParseResult(String queryString) {}

    private enum LogicalOperator {
        AND,
        OR
    }

    private enum ConditionOperator {
        EQ,
        NEQ,
        GT,
        GTE,
        LT,
        LTE,
        CONTAINS,
        NOT_CONTAINS
    }

    private interface Node {
        String toQueryString();
    }

    private static final class ConditionNode implements Node {
        private final String field;
        private final ConditionOperator operator;
        private final String value;

        private ConditionNode(String field, ConditionOperator operator, String value) {
            this.field = field;
            this.operator = operator;
            this.value = value;
        }

        @Override
        public String toQueryString() {
            return translateCondition(field, operator, value);
        }
    }

    private static final class NotNode implements Node {
        private final Node child;

        private NotNode(Node child) {
            this.child = child;
        }

        @Override
        public String toQueryString() {
            String expression = child.toQueryString();
            return "NOT (" + expression + ")";
        }
    }

    private static final class BinaryNode implements Node {
        private final Node left;
        private final Node right;
        private final LogicalOperator operator;

        private BinaryNode(Node left, Node right, LogicalOperator operator) {
            this.left = left;
            this.right = right;
            this.operator = operator;
        }

        @Override
        public String toQueryString() {
            return "(" + left.toQueryString() + " " + operator.name() + " " + right.toQueryString() + ")";
        }
    }

    private static final class Parser {
        private final Lexer lexer;
        private Token current;

        private Parser(String input) {
            this.lexer = new Lexer(input);
            this.current = lexer.nextToken();
        }

        private Node parseExpression() {
            Node node = parseTerm();
            while (match(TokenType.OR)) {
                Node right = parseTerm();
                node = new BinaryNode(node, right, LogicalOperator.OR);
            }
            return node;
        }

        private Node parseTerm() {
            Node node = parseFactor();
            while (match(TokenType.AND)) {
                Node right = parseFactor();
                node = new BinaryNode(node, right, LogicalOperator.AND);
            }
            return node;
        }

        private Node parseFactor() {
            if (match(TokenType.NOT)) {
                return new NotNode(parseFactor());
            }
            if (match(TokenType.LPAREN)) {
                Node expression = parseExpression();
                expect(TokenType.RPAREN, "Missing closing parenthesis");
                return expression;
            }
            return parseCondition();
        }

        private Node parseCondition() {
            Token fieldToken = expect(TokenType.WORD, "Expected field name");
            String field = fieldToken.text().toLowerCase(Locale.ROOT);

            ConditionOperator operator;
            if (match(TokenType.EQ)) {
                operator = ConditionOperator.EQ;
            } else if (match(TokenType.NEQ)) {
                operator = ConditionOperator.NEQ;
            } else if (match(TokenType.GTE)) {
                operator = ConditionOperator.GTE;
            } else if (match(TokenType.GT)) {
                operator = ConditionOperator.GT;
            } else if (match(TokenType.LTE)) {
                operator = ConditionOperator.LTE;
            } else if (match(TokenType.LT)) {
                operator = ConditionOperator.LT;
            } else if (match(TokenType.CONTAINS)) {
                operator = ConditionOperator.CONTAINS;
            } else if (match(TokenType.NOT_CONTAINS)) {
                operator = ConditionOperator.NOT_CONTAINS;
            } else {
                throw new IllegalArgumentException("Unsupported operator for field '" + field + "'");
            }

            Token valueToken = current;
            if (match(TokenType.STRING) || match(TokenType.WORD)) {
                return new ConditionNode(field, operator, valueToken.text());
            }
            throw new IllegalArgumentException("Missing value for condition on field '" + field + "'");
        }

        private boolean match(TokenType expected) {
            if (current.type() == expected) {
                current = lexer.nextToken();
                return true;
            }
            return false;
        }

        private Token expect(TokenType expected, String message) {
            if (current.type() != expected) {
                throw new IllegalArgumentException(message + " (found '" + current.text() + "')");
            }
            Token token = current;
            current = lexer.nextToken();
            return token;
        }
    }

    private enum TokenType {
        LPAREN,
        RPAREN,
        AND,
        OR,
        NOT,
        WORD,
        STRING,
        EQ,
        NEQ,
        GT,
        GTE,
        LT,
        LTE,
        CONTAINS,
        NOT_CONTAINS,
        EOF
    }

    private record Token(TokenType type, String text) {}

    private static final class Lexer {
        private final String input;
        private final int length;
        private int position;

        private Lexer(String input) {
            this.input = input;
            this.length = input.length();
        }

        private Token nextToken() {
            skipWhitespace();
            if (position >= length) {
                return new Token(TokenType.EOF, "");
            }

            char ch = input.charAt(position);
            if (ch == '(') {
                position++;
                return new Token(TokenType.LPAREN, "(");
            }
            if (ch == ')') {
                position++;
                return new Token(TokenType.RPAREN, ")");
            }
            if (ch == '"') {
                return readQuoted();
            }
            if (isComparisonStart(ch)) {
                return readComparison();
            }
            if (Character.isLetterOrDigit(ch) || ch == '_' || ch == '-' || ch == ':' || ch == '.' || ch == '/') {
                return readWordLike();
            }

            throw new IllegalArgumentException("Unexpected character '" + ch + "' in query");
        }

        private Token readQuoted() {
            position++; // consume opening quote
            StringBuilder sb = new StringBuilder();
            boolean closed = false;
            while (position < length) {
                char ch = input.charAt(position++);
                if (ch == '"') {
                    closed = true;
                    break;
                }
                if (ch == '\\' && position < length) {
                    char next = input.charAt(position++);
                    sb.append(next);
                } else {
                    sb.append(ch);
                }
            }
            if (!closed) {
                throw new IllegalArgumentException("Unterminated string literal in query");
            }
            return new Token(TokenType.STRING, sb.toString());
        }

        private Token readComparison() {
            if (position + 1 < length) {
                String two = input.substring(position, position + 2);
                switch (two) {
                    case "==" -> {
                        position += 2;
                        return new Token(TokenType.EQ, two);
                    }
                    case "!=" -> {
                        position += 2;
                        return new Token(TokenType.NEQ, two);
                    }
                    case ">=" -> {
                        position += 2;
                        return new Token(TokenType.GTE, two);
                    }
                    case "<=" -> {
                        position += 2;
                        return new Token(TokenType.LTE, two);
                    }
                }
            }
            char single = input.charAt(position++);
            return switch (single) {
                case '>' -> new Token(TokenType.GT, ">");
                case '<' -> new Token(TokenType.LT, "<");
                case '=' -> new Token(TokenType.EQ, "=");
                default -> throw new IllegalArgumentException("Unexpected operator starting with '" + single + "'");
            };
        }

        private Token readWordLike() {
            int start = position;
            while (position < length) {
                char ch = input.charAt(position);
                if (Character.isLetterOrDigit(ch) || ch == '_' || ch == '-' || ch == ':' || ch == '.' || ch == '/') {
                    position++;
                } else {
                    break;
                }
            }

            String word = input.substring(start, position);
            String upper = word.toUpperCase(Locale.ROOT);
            return switch (upper) {
                case "AND" -> new Token(TokenType.AND, word);
                case "OR" -> new Token(TokenType.OR, word);
                case "NOT" -> new Token(TokenType.NOT, word);
                case "CONTAINS" -> new Token(TokenType.CONTAINS, word);
                case "NOT_CONTAINS" -> new Token(TokenType.NOT_CONTAINS, word);
                default -> new Token(TokenType.WORD, word);
            };
        }

        private void skipWhitespace() {
            while (position < length && Character.isWhitespace(input.charAt(position))) {
                position++;
            }
        }

        private boolean isComparisonStart(char ch) {
            return ch == '!' || ch == '=' || ch == '<' || ch == '>';
        }
    }

    private static String translateCondition(String field, ConditionOperator operator, String value) {
        return switch (field) {
            case "level" -> translateLevelCondition(operator, value);
            case "message" -> translateMessageCondition(operator, value);
            case "text", "raw" -> translateRawCondition(operator, value);
            case "timestamp" -> translateTimestampCondition(operator, value);
            case "source" -> translateSourceCondition(operator, value);
            default -> throw new IllegalArgumentException("Unsupported field '" + field + "'");
        };
    }

    private static String translateLevelCondition(ConditionOperator operator, String value) {
        String normalized = value.toUpperCase(Locale.ROOT);
        String clause = "level.keyword:\"" + escapePhrase(normalized) + "\"";
        return switch (operator) {
            case EQ, CONTAINS -> clause;
            case NEQ, NOT_CONTAINS -> "NOT " + clause;
            default -> throw new IllegalArgumentException("Operator not supported for level field");
        };
    }

    private static String translateMessageCondition(ConditionOperator operator, String value) {
        String clause = "message:\"" + escapePhrase(value) + "\"";
        return switch (operator) {
            case EQ, CONTAINS -> clause;
            case NEQ, NOT_CONTAINS -> "NOT " + clause;
            default -> throw new IllegalArgumentException("Operator not supported for message field");
        };
    }

    private static String translateRawCondition(ConditionOperator operator, String value) {
        String clause = "raw:\"" + escapePhrase(value) + "\"";
        return switch (operator) {
            case EQ, CONTAINS -> clause;
            case NEQ, NOT_CONTAINS -> "NOT " + clause;
            default -> throw new IllegalArgumentException("Operator not supported for raw field");
        };
    }

    private static String translateSourceCondition(ConditionOperator operator, String value) {
        String clause = "source.keyword:\"" + escapePhrase(value) + "\"";
        return switch (operator) {
            case EQ, CONTAINS -> clause;
            case NEQ, NOT_CONTAINS -> "NOT " + clause;
            default -> throw new IllegalArgumentException("Operator not supported for source field");
        };
    }

    private static String translateTimestampCondition(ConditionOperator operator, String value) {
        Instant instant = parseTimestamp(value);
        String iso = instant.toString();
        return switch (operator) {
            case EQ -> "timestamp:[" + iso + " TO " + iso + "]";
            case GTE -> "timestamp:[" + iso + " TO *]";
            case GT -> "timestamp:{" + iso + " TO *}";
            case LTE -> "timestamp:[* TO " + iso + "]";
            case LT -> "timestamp:{* TO " + iso + "}";
            default -> throw new IllegalArgumentException("Operator not supported for timestamp field");
        };
    }

    private static Instant parseTimestamp(String value) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException("Timestamp value cannot be empty");
        }
        String trimmed = value.trim();
        try {
            return Instant.parse(trimmed);
        } catch (DateTimeParseException ignored) {
            // try offset datetime
        }
        try {
            return OffsetDateTime.parse(trimmed).toInstant();
        } catch (DateTimeParseException ignored) {
            // try local datetime
        }
        try {
            LocalDateTime localDateTime = LocalDateTime.parse(trimmed, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            return localDateTime.atZone(ZoneId.systemDefault()).toInstant();
        } catch (DateTimeParseException ignored) {
            // try local date
        }
        try {
            LocalDate localDate = LocalDate.parse(trimmed, DateTimeFormatter.ISO_LOCAL_DATE);
            return localDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
        } catch (DateTimeParseException ignored) {
            throw new IllegalArgumentException("Timestamp value '" + value + "' is not in a supported format");
        }
    }

    private static String escapePhrase(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}