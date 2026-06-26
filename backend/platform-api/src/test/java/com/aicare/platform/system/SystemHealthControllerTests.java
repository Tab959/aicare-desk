package com.aicare.platform.system;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SystemHealthController.class)
@TestPropertySource(properties = "aicare.version=0.1.0-test")
class SystemHealthControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsPlatformHealth() throws Exception {
        mockMvc.perform(get("/api/v1/system/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("aicare-platform-api"))
                .andExpect(jsonPath("$.version").value("0.1.0-test"));
    }
}
