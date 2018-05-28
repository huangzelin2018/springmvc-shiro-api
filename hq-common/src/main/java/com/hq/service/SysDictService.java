package com.hq.service;

import com.hq.entity.SysDictEntity;

import java.util.List;
import java.util.Map;

/**
 * 
 * 
 * @author linyuebin
 * @email trust_100@163.com
 * @date 2017-07-26 16:03:29
 */
public interface SysDictService {
	
	SysDictEntity queryObject(Integer id);
	
	List<SysDictEntity> queryList(Map<String, Object> map);
	
	int queryTotal(Map<String, Object> map);
	
	void save(SysDictEntity sysDict);
	
	void update(SysDictEntity sysDict);
	
	void delete(Integer id);
	
	void deleteBatch(Integer[] ids);
	
	List<SysDictEntity> queryTree();
}
