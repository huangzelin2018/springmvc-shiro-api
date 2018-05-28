package com.hq.entity;

import java.io.Serializable;
import java.util.Date;



/**
 * 
 * 
 * @author linyuebin
 * @email trust_100@163.com
 * @date 2017-07-26 16:03:29
 */
public class SysDictEntity implements Serializable {
	private static final long serialVersionUID = 1L;
	
	//自增主键ID
	private Integer id;
	//父节点ID
	private Integer parentId;
	//字典码
	private String key;
	//字典值
	private String value;
	//备注
	private String notes;
	//序号
	private Integer order;

	/**
	 * 设置：自增主键ID
	 */
	public void setId(Integer id) {
		this.id = id;
	}
	/**
	 * 获取：自增主键ID
	 */
	public Integer getId() {
		return id;
	}
	/**
	 * 设置：父节点ID
	 */
	public void setParentId(Integer parentId) {
		this.parentId = parentId;
	}
	/**
	 * 获取：父节点ID
	 */
	public Integer getParentId() {
		return parentId;
	}
	/**
	 * 设置：字典码
	 */
	public void setKey(String key) {
		this.key = key;
	}
	/**
	 * 获取：字典码
	 */
	public String getKey() {
		return key;
	}
	/**
	 * 设置：字典值
	 */
	public void setValue(String value) {
		this.value = value;
	}
	/**
	 * 获取：字典值
	 */
	public String getValue() {
		return value;
	}
	/**
	 * 设置：备注
	 */
	public void setNotes(String notes) {
		this.notes = notes;
	}
	/**
	 * 获取：备注
	 */
	public String getNotes() {
		return notes;
	}
	/**
	 * 设置：序号
	 */
	public void setOrder(Integer order) {
		this.order = order;
	}
	/**
	 * 获取：序号
	 */
	public Integer getOrder() {
		return order;
	}
}
