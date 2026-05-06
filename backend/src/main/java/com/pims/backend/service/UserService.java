package com.pims.backend.service;

import com.pims.backend.dto.auth.RegisterRequest;
import com.pims.backend.entity.AppUser;
import java.util.List;
import java.util.Optional;

public interface UserService {
    List<AppUser> getAllUsers();

    List<AppUser> getVets();

    Optional<AppUser> getUserById(Long id);

    AppUser createUser(RegisterRequest request);

    AppUser updateUser(Long id, RegisterRequest request);

    void deleteUser(Long id);
}
