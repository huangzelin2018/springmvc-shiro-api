/**
 * @company hq
 * @date 2017年6月22日
 */
package com.hq.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.hq.entity.SysDictionaryEntity;
import com.hq.service.SysDictionaryService;

import net.sf.json.JSONObject;

/**
 * 公用逻辑
 * @author linyuebin
 * @date 2017年6月22日下午4:15:35
 */
@Controller
@RequestMapping("/common")
public class CommonController {

	@Autowired
	private SysDictionaryService sysDictionaryService;

	/**
	 * 字典数据
	 * 
	 * @param json
	 * @return
	 */
	@RequestMapping("/dictData")
	@ResponseBody
	public List<SysDictionaryEntity> getCommonData(@RequestBody String json) {
		JSONObject jsonObj = JSONObject.fromObject(json);
		Map<String, Object> map = new HashMap<String, Object>();
		map.put("kind", jsonObj.getString("kind"));
		List<SysDictionaryEntity> list = sysDictionaryService.queryList(map);
		return list;
	}

}
