package com.hq.service;

import com.hq.entity.SysDictionaryEntity;

import java.util.List;
import java.util.Map;

/**
 * 
 * 
 * @author chenshun
 * @email sunlightcs@gmail.com
 * @date 2017-06-20 17:42:22
 */
public interface SysDictionaryService {
	
	SysDictionaryEntity queryObject(Long id);
	
	List<SysDictionaryEntity> queryList(Map<String, Object> map);
	
	int queryTotal(Map<String, Object> map);
	
	void save(SysDictionaryEntity sysDictionary);
	
	void update(SysDictionaryEntity sysDictionary);
	
	void delete(Long id);
	
	void deleteBatch(Long[] ids);
}
