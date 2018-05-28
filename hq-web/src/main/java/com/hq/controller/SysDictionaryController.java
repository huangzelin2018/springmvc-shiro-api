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
import org.springframework.web.servlet.ModelAndView;

import com.hq.entity.SysDictionaryEntity;
import com.hq.service.SysDictionaryService;
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
@RequestMapping("sysdictionary")
public class SysDictionaryController {
	@Autowired
	private SysDictionaryService sysDictionaryService;
	
	/**
	 * 列表
	 */
	@RequestMapping("/list")
	@RequiresPermissions("sysdictionary:list")
	public R list(@RequestParam Map<String, Object> params){
		//查询列表数据
        Query query = new Query(params);

		List<SysDictionaryEntity> sysDictionaryList = sysDictionaryService.queryList(query);
		int total = sysDictionaryService.queryTotal(query);
		
		PageUtils pageUtil = new PageUtils(sysDictionaryList, total, query.getLimit(), query.getPage());
		
		return R.ok().put("page", pageUtil);
	}
	
	
	/**
	 * 信息
	 */
	@RequestMapping("/info/{id}")
	@RequiresPermissions("sysdictionary:info")
	public R info(@PathVariable("id") Long id){
		SysDictionaryEntity sysDictionary = sysDictionaryService.queryObject(id);
		
		return R.ok().put("sysDictionary", sysDictionary);
	}
	
	/**
	 * 保存
	 */
	@RequestMapping("/save")
	@RequiresPermissions("sysdictionary:save")
	public R save(@RequestBody SysDictionaryEntity sysDictionary){
		sysDictionaryService.save(sysDictionary);
		
		return R.ok();
	}
	
	/**
	 * 修改
	 */
	@RequestMapping("/update")
	@RequiresPermissions("sysdictionary:update")
	public R update(@RequestBody SysDictionaryEntity sysDictionary){
		sysDictionaryService.update(sysDictionary);
		
		return R.ok();
	}
	
	/**
	 * 删除
	 */
	@RequestMapping("/delete")
	@RequiresPermissions("sysdictionary:delete")
	public R delete(@RequestBody Long[] ids){
		sysDictionaryService.deleteBatch(ids);
		
		return R.ok();
	}
	
	@RequestMapping("sys/dictionary")
	public ModelAndView page(String id) {
		ModelAndView mv = new ModelAndView("sys/dictionary.html");
		System.out.println(2);
		mv.addObject("ww", "wddddddddw");
		return mv;
	}
}
