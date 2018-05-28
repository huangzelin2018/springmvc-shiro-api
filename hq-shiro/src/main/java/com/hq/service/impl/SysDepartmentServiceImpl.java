package com.hq.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hq.dao.SysDepartmentDao;
import com.hq.entity.SysDepartmentEntity;
import com.hq.service.SysDepartmentService;
import com.hq.utils.DeptTree;

@Service("sysDepartmentService")
public class SysDepartmentServiceImpl implements SysDepartmentService {
	@Autowired
	private SysDepartmentDao sysDepartmentDao;

	@Override
	public SysDepartmentEntity queryObject(Long id) {
		return sysDepartmentDao.queryObject(id);
	}

	@Override
	public List<SysDepartmentEntity> queryList(Map<String, Object> map) {
		return sysDepartmentDao.queryList(map);
	}

	@Override
	public int queryTotal(Map<String, Object> map) {
		return sysDepartmentDao.queryTotal(map);
	}

	@Override
	public void save(SysDepartmentEntity sysDepartment) {
		sysDepartmentDao.save(sysDepartment);
	}

	@Override
	public void update(SysDepartmentEntity sysDepartment) {
		sysDepartmentDao.update(sysDepartment);
	}

	@Override
	public void delete(Long id) {
		sysDepartmentDao.delete(id);
	}

	@Override
	public void deleteBatch(Long[] ids) {
		sysDepartmentDao.deleteBatch(ids);
	}

	@Override
	public List<SysDepartmentEntity> queryDepartList(Long deptId) {
		List<SysDepartmentEntity> list = sysDepartmentDao.queryList(new HashMap<String, Object>());
		SysDepartmentEntity sysDepartmentEntity = sysDepartmentDao.queryObject(deptId);
		Long parentId = sysDepartmentEntity.getParentId();
		return DeptTree.getChildNodes(list, deptId, parentId);
	}

}
