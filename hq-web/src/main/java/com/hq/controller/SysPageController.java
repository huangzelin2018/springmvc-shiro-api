package com.hq.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * 系统页面视图
 * 
 * @author chenshun
 * @email sunlightcs@gmail.com
 * @date 2016年11月24日 下午11:05:27
 */
@Controller
public class SysPageController {

	@RequestMapping("{module}/{url}.html")
	public String page(@PathVariable("module") String module , @PathVariable("url") String url){
		System.out.println("接收到请求：" + module + "/" + url);
		return module + "/" + url + ".html";
	}
	
	
//	@RequestMapping("sys/{url}.html")
//	public String page(@PathVariable("url") String url) {
//		System.out.println("接收到请求：" + url);
//		return "sys/" + url + ".html";
//	}
//
//	@RequestMapping("generator/{url}.html")
//	public String generator(@PathVariable("url") String url) {
//		System.out.println("接收到请求：" + url);
//		return "generator/" + url + ".html";
//	}
//
//	@RequestMapping("report/{url}.html")
//	public String report(@PathVariable("url") String url) {
//		System.out.println("接收到请求：" + url);
//		return "report/" + url + ".html";
//	}
//	
//	@RequestMapping("opportunity/{url}.html")
//	public String opportunity(@PathVariable("url") String url) {
//		System.out.println("接收到请求：" + url);
//		return "opportunity/" + url + ".html";
//	}
	
}
