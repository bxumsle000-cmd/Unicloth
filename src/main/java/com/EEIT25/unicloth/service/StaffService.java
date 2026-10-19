package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.staff.StaffFilterRequest;
import com.EEIT25.unicloth.dto.staff.StaffResponse;
import com.EEIT25.unicloth.repository.StaffRepository;
import com.EEIT25.unicloth.security.CurrentStaff;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StaffService {
    private final PasswordEncoder passwordEncoder;
    private final CurrentStaff currentStaff;
    private final StaffRepository staffRepository;


    @Transactional
    public Page<StaffResponse> getStaff(StaffFilterRequest filter, Pageable pageable){
        Page<StaffResponse> staffPage = staffRepository.findByFilter(
                filter.keyword(),filter.department(),filter.status(),pageable);

        return staffPage;
    }

}
