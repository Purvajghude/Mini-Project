package com.meshconnect.service;

import com.meshconnect.entity.AppUser;
import com.meshconnect.entity.Block;
import com.meshconnect.exception.BadRequestException;
import com.meshconnect.exception.NotFoundException;
import com.meshconnect.repository.AppUserRepository;
import com.meshconnect.repository.BlockRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BlockService {
    private final CurrentUserService currentUser;
    private final AppUserRepository users;
    private final BlockRepository blocks;

    public BlockService(CurrentUserService currentUser, AppUserRepository users, BlockRepository blocks) {
        this.currentUser = currentUser;
        this.users = users;
        this.blocks = blocks;
    }

    @Transactional(readOnly = true)
    public boolean blockedEitherWay(Long firstId, Long secondId) {
        return blocks.existsByBlockerIdAndBlockedId(firstId, secondId) || blocks.existsByBlockerIdAndBlockedId(secondId, firstId);
    }

    @Transactional
    public void block(Long targetId) {
        AppUser me = currentUser.requireUser();
        if (me.getId().equals(targetId)) throw new BadRequestException("You cannot block yourself");
        AppUser target = users.findById(targetId).orElseThrow(() -> new NotFoundException("User not found"));
        if (!blocks.existsByBlockerIdAndBlockedId(me.getId(), targetId)) blocks.save(new Block(me, target));
    }

    @Transactional
    public void unblock(Long targetId) {
        AppUser me = currentUser.requireUser();
        blocks.deleteByBlockerIdAndBlockedId(me.getId(), targetId);
    }
}
