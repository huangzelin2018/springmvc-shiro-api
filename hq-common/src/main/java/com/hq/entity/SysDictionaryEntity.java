package com.hq.entity;

import java.io.Serializable;

/**
 * 
 * 
 * @author chenshun
 * @email sunlightcs@gmail.com
 * @date 2017-06-20 17:42:22
 */
public class SysDictionaryEntity implements Serializable {
	private static final long serialVersionUID = 1L;

	// 主键ID
	private Long id;
	// 字典项
	private String kind;
	// 字典值
	private String code;
	// 字典项详情
	private String detail;

	/**
	 * 设置：主键ID
	 */
	public void setId(Long id) {
		this.id = id;
	}

	/**
	 * 获取：主键ID
	 */
	public Long getId() {
		return id;
	}

	/**
	 * 设置：字典项
	 */
	public void setKind(String kind) {
		this.kind = kind;
	}

	/**
	 * 获取：字典项
	 */
	public String getKind() {
		return kind;
	}

	/**
	 * 设置：字典值
	 */
	public void setCode(String code) {
		this.code = code;
	}

	/**
	 * 获取：字典值
	 */
	public String getCode() {
		return code;
	}

	/**
	 * 设置：字典项详情
	 */
	public void setDetail(String detail) {
		this.detail = detail;
	}

	/**
	 * 获取：字典项详情
	 */
	public String getDetail() {
		return detail;
	}
}
