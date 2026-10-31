package com.mesh.projects;

import com.mesh.skills.Skill;
import com.mesh.skills.SkillRepository;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BlueprintControllerTest {
    @Test void same_idea_produces_same_editable_template_without_writes() {
        SkillRepository skills = mock(SkillRepository.class);
        when(skills.findAllByOrderByNameAsc()).thenReturn(List.of());
        BlueprintController controller = new BlueprintController(skills);
        var request = new BlueprintController.Request("Campus scheduling web app", null, null, null);
        assertEquals(controller.suggest(request), controller.suggest(request));
        verify(skills, never()).save(any(Skill.class));
    }
}
