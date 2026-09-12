package com.example.moneydi.common;

import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiExceptionHandler {
    public record ApiError(String code, String message) {}

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> invalidInput(IllegalArgumentException exception) {
        return response(HttpStatus.BAD_REQUEST, "INVALID_INPUT", exception.getMessage());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> notFound(ResourceNotFoundException exception) {
        return response(HttpStatus.NOT_FOUND, "NOT_FOUND", exception.getMessage());
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiError> malformedRequest(Exception exception) {
        return response(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "입력 형식을 확인해주세요. 금액은 정수, 날짜는 YYYY-MM-DD 형식이어야 합니다.");
    }

    @ExceptionHandler({ConcurrencyFailureException.class, DataIntegrityViolationException.class})
    public ResponseEntity<ApiError> conflict(Exception exception) {
        return response(HttpStatus.CONFLICT, "CONFLICT", "다른 변경과 충돌했습니다. 최신 내용을 불러온 뒤 다시 시도해주세요.");
    }

    private ResponseEntity<ApiError> response(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(new ApiError(code, message));
    }
}
