package com.hq;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

import org.junit.Before;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

@RunWith(SpringJUnit4ClassRunner.class)  
@WebAppConfiguration  
@ContextConfiguration(locations = { "classpath:*.xml" })  
public class TestController {

	 @Autowired  
	 private WebApplicationContext wac;
	  
	 private MockMvc mockMvc;
	 
	 @Before  
	 public void setup() {  
	        // webAppContextSetup 注意上面的static import  
	        // webAppContextSetup 构造的WEB容器可以添加fileter 但是不能添加listenCLASS  
	        // WebApplicationContext context =  
	        // ContextLoader.getCurrentWebApplicationContext();  
	        // 如果控制器包含如上方法 则会报空指针  
	        this.mockMvc = webAppContextSetup(this.wac).build();  
	 }
	 
	 @org.junit.Test
	 public void demo() throws Exception{
		 this.mockMvc.perform(get("/sys/user/list"))
		 .andExpect(status().isOk());
	 }

}
