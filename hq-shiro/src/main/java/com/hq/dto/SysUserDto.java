/**
 * @company hq
 * @date 2017年7月25日
 */
package com.hq.dto;

import java.util.Date;
import java.util.List;

import com.hq.entity.SysUserEntity;

/**
 * @author linyuebin
 * @date 2017年7月25日上午9:03:48
 */
public class SysUserDto {

	/**
	 * 用户ID
	 */
	private Long userId;

	/**
	 * 部门ID
	 */
	private Long deptId;

	private String companyName;
	/**
	 * 部门名称
	 */
	private String deptName;

	/**
	 * 用户名
	 */
	private String username;

	/**
	 * 真实姓名
	 */
	private String realname;
	/**
	 * 密码
	 */
	private transient String password;

	/**
	 * 邮箱
	 */
	private String email;

	/**
	 * 手机号
	 */
	private String mobile;

	/**
	 * 状态 0：禁用 1：正常
	 */
	private Integer status;

	/**
	 * 角色ID列表
	 */
	private List<Long> roleIdList;

	/**
	 * 创建者ID
	 */
	private Long createUserId;

	/**
	 * 创建时间
	 */
	private Date createTime;

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public Long getDeptId() {
		return deptId;
	}

	public void setDeptId(Long deptId) {
		this.deptId = deptId;
	}

	public String getDeptName() {
		return deptName;
	}

	public void setDeptName(String deptName) {
		this.deptName = deptName;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getRealname() {
		return realname;
	}

	public void setRealname(String realname) {
		this.realname = realname;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getMobile() {
		return mobile;
	}

	public void setMobile(String mobile) {
		this.mobile = mobile;
	}

	public Integer getStatus() {
		return status;
	}

	public void setStatus(Integer status) {
		this.status = status;
	}

	public List<Long> getRoleIdList() {
		return roleIdList;
	}

	public void setRoleIdList(List<Long> roleIdList) {
		this.roleIdList = roleIdList;
	}

	public Long getCreateUserId() {
		return createUserId;
	}

	public void setCreateUserId(Long createUserId) {
		this.createUserId = createUserId;
	}

	public Date getCreateTime() {
		return createTime;
	}

	public void setCreateTime(Date createTime) {
		this.createTime = createTime;
	}

	public SysUserDto(SysUserEntity sysUserEntity, String deptName, String companyName) {
		this.userId = sysUserEntity.getUserId();
		this.companyName = companyName;
		this.deptId = sysUserEntity.getDeptId();
		this.deptName = deptName;
		this.username = sysUserEntity.getUsername();
		this.realname = sysUserEntity.getRealname();
		this.email = sysUserEntity.getEmail();
		this.mobile = sysUserEntity.getMobile();
		this.status = sysUserEntity.getStatus();
		this.roleIdList = sysUserEntity.getRoleIdList();
		this.createUserId = sysUserEntity.getCreateUserId();
		this.createTime = sysUserEntity.getCreateTime();
	}

	public SysUserDto() {
		super();
	}

	public String getCompanyName() {
		return companyName;
	}

	public void setCompanyName(String companyName) {
		this.companyName = companyName;
	}

	
}
