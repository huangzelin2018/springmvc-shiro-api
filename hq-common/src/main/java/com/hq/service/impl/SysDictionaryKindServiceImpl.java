package com.hq.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

import com.hq.dao.SysDictionaryKindDao;
import com.hq.entity.SysDictionaryKindEntity;
import com.hq.service.SysDictionaryKindService;



@Service("sysDictionaryKindService")
public class SysDictionaryKindServiceImpl implements SysDictionaryKindService {
	@Autowired
	private SysDictionaryKindDao sysDictionaryKindDao;
	
	@Override
	public SysDictionaryKindEntity queryObject(Long id){
		return sysDictionaryKindDao.queryObject(id);
	}
	
	@Override
	public List<SysDictionaryKindEntity> queryList(Map<String, Object> map){
		return sysDictionaryKindDao.queryList(map);
	}
	
	@Override
	public int queryTotal(Map<String, Object> map){
		return sysDictionaryKindDao.queryTotal(map);
	}
	
	@Override
	public void save(SysDictionaryKindEntity sysDictionaryKind){
		sysDictionaryKindDao.save(sysDictionaryKind);
	}
	
	@Override
	public void update(SysDictionaryKindEntity sysDictionaryKind){
		sysDictionaryKindDao.update(sysDictionaryKind);
	}
	
	@Override
	public void delete(Long id){
		sysDictionaryKindDao.delete(id);
	}
	
	@Override
	public void deleteBatch(Long[] ids){
		sysDictionaryKindDao.deleteBatch(ids);
	}
	
}
