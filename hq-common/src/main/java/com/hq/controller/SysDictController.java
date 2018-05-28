package com.hq.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.hq.dto.SysDictDto;
import com.hq.entity.SysDictEntity;
import com.hq.service.SysDictService;
import com.hq.utils.PageUtils;
import com.hq.utils.Query;
import com.hq.utils.R;


/**
 * 
 * 
 * @author linyuebin
 * @email trust_100@163.com
 * @date 2017-07-26 16:03:29
 */
@RestController
@RequestMapping("sysdict")
public class SysDictController {
	@Autowired
	private SysDictService sysDictService;
	
	/**
	 * 列表
	 */
	@RequestMapping("/list")
	@RequiresPermissions("sysdict:list")
	public R list(@RequestParam Map<String, Object> params){
		//查询列表数据
        Query query = new Query(params);
System.out.println(query.toString());
		List<SysDictEntity> sysDictList = sysDictService.queryList(query);
		int total = sysDictService.queryTotal(query);
		PageUtils pageUtil = new PageUtils(sysDictList, total, query.getLimit(), query.getPage());
		
		return R.ok().put("page", pageUtil);
	}
	
	@RequestMapping("/perms")
	@ResponseBody
	public R perms(){
		List<SysDictDto> list = new ArrayList<SysDictDto>();
		List<SysDictEntity> sysDictList = sysDictService.queryTree();
		for (SysDictEntity sysDictEntity : sysDictList) {
			SysDictDto sysDictDto = new SysDictDto(sysDictEntity);
			list.add(sysDictDto);
		}
		return R.ok().put("sysDictList", list);
	} 
	
	/**
	 * 信息
	 */
	@RequestMapping("/info/{id}")
	@RequiresPermissions("sysdict:info")
	public R info(@PathVariable("id") Integer id){
		SysDictEntity sysDict = sysDictService.queryObject(id);
		
		return R.ok().put("sysDict", sysDict);
	}
	
	/**
	 * 保存
	 */
	@RequestMapping("/save")
	@RequiresPermissions("sysdict:save")
	public R save(@RequestBody SysDictEntity sysDict){
		sysDictService.save(sysDict);
		
		return R.ok();
	}
	
	/**
	 * 修改
	 */
	@RequestMapping("/update")
	@RequiresPermissions("sysdict:update")
	public R update(@RequestBody SysDictEntity sysDict){
		sysDictService.update(sysDict);
		
		return R.ok();
	}
	
	/**
	 * 删除
	 */
	@RequestMapping("/delete")
	@RequiresPermissions("sysdict:delete")
	public R delete(@RequestBody Integer[] ids){
		sysDictService.deleteBatch(ids);
		
		return R.ok();
	}
	
}
