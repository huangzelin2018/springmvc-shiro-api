package com.hq.service;

import com.hq.entity.SysDictionaryKindEntity;

import java.util.List;
import java.util.Map;

/**
 * 
 * 
 * @author chenshun
 * @email sunlightcs@gmail.com
 * @date 2017-06-20 17:42:22
 */
public interface SysDictionaryKindService {
	
	SysDictionaryKindEntity queryObject(Long id);
	
	List<SysDictionaryKindEntity> queryList(Map<String, Object> map);
	
	int queryTotal(Map<String, Object> map);
	
	void save(SysDictionaryKindEntity sysDictionaryKind);
	
	void update(SysDictionaryKindEntity sysDictionaryKind);
	
	void delete(Long id);
	
	void deleteBatch(Long[] ids);
}
