/**
 * @company hq
 * @date 2017年7月10日
 */
package com.hq.utils;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import com.hq.entity.SysDepartmentEntity;

/**
 * @author linyuebin
 * @date 2017年7月10日下午3:17:47
 */
public class DeptTree {

	private static List<SysDepartmentEntity> returnList = null;

	/**
	 * 根据父节点的ID获取所有子节点
	 * 
	 * @param list
	 *            分类表
	 * @param deptId
	 *            部门节点ID
	 * @param parentId
	 *            父节点ID          
	 * @return String
	 */
	public static List<SysDepartmentEntity> getChildNodes(List<SysDepartmentEntity> list, Long deptId,Long parentId) {
		returnList = new ArrayList<SysDepartmentEntity>();
		if (list == null && deptId == null)
			return null;
		for (Iterator<SysDepartmentEntity> iterator = list.iterator(); iterator.hasNext();) {
			SysDepartmentEntity node = (SysDepartmentEntity) iterator.next();
			// 一、根据传入的某个父节点ID,遍历该父节点的所有子节点
			if (node.getParentId() == parentId && deptId == node.getId()) {
				recursionFn(list, node);
			}
			// 二、遍历所有的父节点下的所有子节点
			/*
			 * if (node.getParentId()==0) { recursionFn(list, node); }
			 */
		}
		return returnList;
	}

	private static void recursionFn(List<SysDepartmentEntity> list, SysDepartmentEntity node) {
		List<SysDepartmentEntity> childList = getChildList(list, node);// 得到子节点列表
		if (hasChild(list, node)) {// 判断是否有子节点
			returnList.add(node);
			Iterator<SysDepartmentEntity> it = childList.iterator();
			while (it.hasNext()) {
				SysDepartmentEntity n = (SysDepartmentEntity) it.next();
				recursionFn(list, n);
			}
		} else {
			returnList.add(node);
		}
	}

	// 得到子节点列表
	private static List<SysDepartmentEntity> getChildList(List<SysDepartmentEntity> list, SysDepartmentEntity node) {
		List<SysDepartmentEntity> nodeList = new ArrayList<SysDepartmentEntity>();
		Iterator<SysDepartmentEntity> it = list.iterator();
		while (it.hasNext()) {
			SysDepartmentEntity n = (SysDepartmentEntity) it.next();
			if (n.getParentId() == node.getId()) {
				nodeList.add(n);
			}
		}
		return nodeList;
	}

	// 判断是否有子节点
	private static boolean hasChild(List<SysDepartmentEntity> list, SysDepartmentEntity node) {
		return getChildList(list, node).size() > 0 ? true : false;
	}

}
