package com.EEIT25.unicloth.security;

import lombok.Getter;
import org.springframework.stereotype.Component;

@Component
@Getter
public class CurrentMember {
    private final  Long  currentId = 1L ;
    private final  String currentToken = "DEV_CURRENT_TOKEN" ;
}
