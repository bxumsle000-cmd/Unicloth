package com.EEIT25.unicloth.dto;

import com.EEIT25.unicloth.entity.Member;

public record LoginResponse(
        Long memberId,
        String token
) {
}
