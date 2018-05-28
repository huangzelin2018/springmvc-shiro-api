/**
 * @company hq
 * @date 2017年7月26日
 */
package com.hq.dto;

import com.hq.entity.SysDictEntity;

/**
 * @author linyuebin
 * @date 2017年7月26日下午5:38:34
 */
public class SysDictDto {

	//自增主键ID
	private Integer id;
	//父节点ID
	private Integer parentId;
	//字典值
	private String name;
	
	public Integer getId() {
		return id;
	}
	public void setId(Integer id) {
		this.id = id;
	}
	public Integer getParentId() {
		return parentId;
	}
	public void setParentId(Integer parentId) {
		this.parentId = parentId;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	
	public SysDictDto(SysDictEntity sysDictEntity){
		this.id = sysDictEntity.getId();
		this.parentId = sysDictEntity.getParentId();
		this.name = sysDictEntity.getValue();
	}
	
}
