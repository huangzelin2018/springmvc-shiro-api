package com.hq.utils;

import org.apache.commons.lang.StringUtils;

/**
 * 控件通用工具
 * @author linyuebin
 *
 */
public class ComponentUtil {

	/**
	 * 方法翻译器
	 * @param fun
	 * @param params
	 * @return
	 * @inheritDoc
	 */
	public static String formatFunction(String fun,String... params){
		String f = fun.replaceAll("\r|\n", "").trim();
		if(f.indexOf("function")==0){
			return fun;
		}else{
			if(null!=params&&params.length>0){
				return "function("+StringUtils.join(params, ",")+"){"+fun+"}";
			}else{
				return "function(){"+fun+"}";
			}
		}
	}
	
	public static void main(String[] args) {
		String fun = "\n\r\t\r\t   xxxxxxxxxxxx}";
		System.out.println(formatFunction(fun,"name","value"));
	}
	
}
