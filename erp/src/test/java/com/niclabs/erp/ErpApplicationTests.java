package com.niclabs.erp;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "admin.seed.password=test-only-admin-password-123")
class ErpApplicationTests {

	@Test
	void contextLoads() {
	}

}
