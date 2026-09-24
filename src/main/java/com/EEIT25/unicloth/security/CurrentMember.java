package com.EEIT25.unicloth.security;

import lombok.Getter;
import org.springframework.stereotype.Component;

@Component
@Getter
public class CurrentMember {
    private final  Long  currentMemberId = 1L ;
    private final  String currentMemberToken = "DEV_CURRENT_TOKEN" ;
}
