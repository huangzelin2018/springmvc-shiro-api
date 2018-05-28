/**
 * @company hq
 */
package com.hq.utils;

import java.util.UUID;

/**
 * UUID生成器
 * @author linyuebin
 * @create_time 2017年6月7日下午4:25:16
 */
public class UUIDGenerator {

	/**
	 * 生成32位UUID，不含“-”符
	 * @return
	 */
	public static final String generateUUID(){
		String uuid = UUID.randomUUID().toString(); 
		return uuid.replaceAll("-", ""); 
	}
	
	public static void main(String[] args) {
		System.out.println(generateUUID());
	}
	
}
