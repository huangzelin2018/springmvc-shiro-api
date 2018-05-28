package com.hq.entity;

import java.io.Serializable;
import java.util.Date;



/**
 * 部门管理
 * 
 * @author linyuebin
 * @email trust_100@163.com
 * @date 2017-07-05 15:26:48
 */
public class SysDepartmentEntity implements Serializable {
	private static final long serialVersionUID = 1L;
	
	//部门ID
	private Long id;
	//父节点ID
	private Long parentId;
	//部门名称
	private String name;
	//状态  0：禁用   1：正常
	private Integer status;
	//创建者ID
	private Long createUserId;
	//创建时间
	private Date createTime;

	/**
	 * 设置：部门ID
	 */
	public void setId(Long id) {
		this.id = id;
	}
	/**
	 * 获取：部门ID
	 */
	public Long getId() {
		return id;
	}
	/**
	 * 设置：父节点ID
	 */
	public void setParentId(Long parentId) {
		this.parentId = parentId;
	}
	/**
	 * 获取：父节点ID
	 */
	public Long getParentId() {
		return parentId;
	}
	/**
	 * 设置：部门名称
	 */
	public void setName(String name) {
		this.name = name;
	}
	/**
	 * 获取：部门名称
	 */
	public String getName() {
		return name;
	}
	/**
	 * 设置：状态  0：禁用   1：正常
	 */
	public void setStatus(Integer status) {
		this.status = status;
	}
	/**
	 * 获取：状态  0：禁用   1：正常
	 */
	public Integer getStatus() {
		return status;
	}
	/**
	 * 设置：创建者ID
	 */
	public void setCreateUserId(Long createUserId) {
		this.createUserId = createUserId;
	}
	/**
	 * 获取：创建者ID
	 */
	public Long getCreateUserId() {
		return createUserId;
	}
	/**
	 * 设置：创建时间
	 */
	public void setCreateTime(Date createTime) {
		this.createTime = createTime;
	}
	/**
	 * 获取：创建时间
	 */
	public Date getCreateTime() {
		return createTime;
	}
	
	@Override
	public String toString() {
		return "SysDepartmentEntity [id=" + id + ", parentId=" + parentId + ", name=" + name + ", status=" + status
				+ ", createUserId=" + createUserId + ", createTime=" + createTime + "]";
	}
	
}
