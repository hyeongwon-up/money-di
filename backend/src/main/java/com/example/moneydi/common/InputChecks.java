package com.example.moneydi.common;

public final class InputChecks {
    // JSON numbers must remain exact in the JavaScript client.
    public static final long MAX_AMOUNT = 9_007_199_254_740_991L;

    private InputChecks() {}

    public static String requiredText(String value, String label, int maxLength) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(label + "을(를) 입력해주세요.");
        String trimmed = value.trim();
        if (trimmed.length() > maxLength) throw new IllegalArgumentException(label + "은(는) " + maxLength + "자 이내로 입력해주세요.");
        return trimmed;
    }

    public static String optionalText(String value, String label, int maxLength) {
        if (value == null || value.isBlank()) return null;
        return requiredText(value, label, maxLength);
    }

    public static long amount(Long value, long minimum) {
        if (value == null || value < minimum || value > MAX_AMOUNT) {
            throw new IllegalArgumentException("금액은 " + minimum + " 이상 " + MAX_AMOUNT + " 이하의 정수로 입력해주세요.");
        }
        return value;
    }
}
