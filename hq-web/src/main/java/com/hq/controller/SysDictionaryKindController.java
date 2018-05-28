package com.hq.controller;

import java.util.List;
import java.util.Map;

import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hq.entity.SysDictionaryKindEntity;
import com.hq.service.SysDictionaryKindService;
import com.hq.utils.PageUtils;
import com.hq.utils.Query;
import com.hq.utils.R;


/**
 * 
 * 
 * @author chenshun
 * @email sunlightcs@gmail.com
 * @date 2017-06-20 17:42:22
 */
@RestController
@RequestMapping("sysdictionarykind")
public class SysDictionaryKindController {
	@Autowired
	private SysDictionaryKindService sysDictionaryKindService;
	
	/**
	 * 列表
	 */
	@RequestMapping("/list")
	@RequiresPermissions("sysdictionarykind:list")
	public R list(@RequestParam Map<String, Object> params){
		//查询列表数据
        Query query = new Query(params);

		List<SysDictionaryKindEntity> sysDictionaryKindList = sysDictionaryKindService.queryList(query);
		int total = sysDictionaryKindService.queryTotal(query);
		
		PageUtils pageUtil = new PageUtils(sysDictionaryKindList, total, query.getLimit(), query.getPage());
		
		return R.ok().put("page", pageUtil);
	}
	
	
	/**
	 * 信息
	 */
	@RequestMapping("/info/{id}")
	@RequiresPermissions("sysdictionarykind:info")
	public R info(@PathVariable("id") Long id){
		SysDictionaryKindEntity sysDictionaryKind = sysDictionaryKindService.queryObject(id);
		
		return R.ok().put("sysDictionaryKind", sysDictionaryKind);
	}
	
	/**
	 * 保存
	 */
	@RequestMapping("/save")
	@RequiresPermissions("sysdictionarykind:save")
	public R save(@RequestBody SysDictionaryKindEntity sysDictionaryKind){
		sysDictionaryKindService.save(sysDictionaryKind);
		
		return R.ok();
	}
	
	/**
	 * 修改
	 */
	@RequestMapping("/update")
	@RequiresPermissions("sysdictionarykind:update")
	public R update(@RequestBody SysDictionaryKindEntity sysDictionaryKind){
		sysDictionaryKindService.update(sysDictionaryKind);
		
		return R.ok();
	}
	
	/**
	 * 删除
	 */
	@RequestMapping("/delete")
	@RequiresPermissions("sysdictionarykind:delete")
	public R delete(@RequestBody Long[] ids){
		sysDictionaryKindService.deleteBatch(ids);
		
		return R.ok();
	}
	
}
